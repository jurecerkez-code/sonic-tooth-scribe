import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, RefreshCw, WifiOff, Wifi, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToothCondition } from "@/types/dental";

interface FailedRecording {
  id: string;
  audioData: string; // base64
  timestamp: string;
  duration: number;
  attempts: number;
  lastAttempt: string;
}

type N8nStatus = "healthy" | "slow" | "down";

const STORAGE_KEY = "failed_recordings";
const MAX_RETRY_ATTEMPTS = 3;
const AUTO_RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Result returned from n8n (via Edge Function)
type WorkflowResult = {
  transcript?: string;
  findings?: { toothNumber: number; condition: ToothCondition; confidence?: number; notes?: string }[];
  teethStatus?: [number, ToothCondition][];
};

interface VoiceRecordingProps {
  onRecordingComplete?: (result: WorkflowResult) => void;
}

export const VoiceRecording = ({ onRecordingComplete }: VoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [n8nStatus, setN8nStatus] = useState<N8nStatus>("healthy");
  const [failedRecordings, setFailedRecordings] = useState<FailedRecording[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const { toast } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const autoRetryIntervalRef = useRef<number | null>(null);

  // Load failed recordings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFailedRecordings(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading failed recordings:", error);
      }
    }
  }, []);

  // Save failed recordings to localStorage
  const saveFailedRecordings = (recordings: FailedRecording[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
    setFailedRecordings(recordings);
  };

  // Convert blob to base64 (data URL)
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Convert base64 (data URL) to blob
  const base64ToBlob = (base64: string): Blob => {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "audio/webm";
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  };

  // Auto-retry failed recordings
  useEffect(() => {
    if (failedRecordings.length > 0 && !offlineMode) {
      autoRetryIntervalRef.current = window.setInterval(() => {
        retryFailedRecordings();
      }, AUTO_RETRY_INTERVAL);

      return () => {
        if (autoRetryIntervalRef.current) {
          clearInterval(autoRetryIntervalRef.current);
        }
      };
    }
  }, [failedRecordings.length, offlineMode]);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      canvasCtx.fillStyle = "#000000";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = "#22c55e";
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) canvasCtx.moveTo(x, y);
        else canvasCtx.lineTo(x, y);

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript("");
      setAiResponse("");
      setRecordingDuration(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Waveform
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
      drawWaveform();

      // Choose supported mime type
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
        mimeType = "audio/mpeg";
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setIsProcessing(true);
        await sendAudioToN8n(audioBlob);
        setIsProcessing(false);

        // Clean up
        stream.getTracks().forEach((t) => t.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();
      };

      mediaRecorderRef.current.start();

      // Timer
      const timer = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
      toast({ title: "Recording Started", description: "Speak your dental findings..." });
      (window as any).recordingTimer = timer;
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please allow microphone access.",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const sendAudioToN8n = async (audioBlob: Blob, retryAttempt = 0): Promise<boolean> => {
    const startTime = Date.now();

    try {
      if (!audioBlob.size || audioBlob.size === 0) {
        toast({
          title: "Recording Error",
          description: "No audio captured. Check your microphone and try again.",
          variant: "destructive",
        });
        return false;
      }

      // Infer extension
      const mimeType = audioBlob.type || "audio/webm";
      const extension = mimeType.includes("mp4")
        ? "mp4"
        : mimeType.includes("mpeg")
          ? "mp3"
          : mimeType.includes("webm")
            ? "webm"
            : "webm";

      if (retryAttempt > 0) {
        toast({
          title: "Retrying Upload",
          description: `Attempt ${retryAttempt + 1} of ${MAX_RETRY_ATTEMPTS}...`,
        });
      }

      // Convert to base64 (no data URL prefix)
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const payload = {
        audioData: base64Audio,
        mimeType,
        fileName: `input.${extension}`,
        timestamp: new Date().toISOString(),
        duration: recordingDuration.toString(),
        type: "voice_recording",
      };

      // Auth
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("send-to-n8n", {
        body: payload,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const responseTime = Date.now() - startTime;
      setN8nStatus(responseTime > 5000 ? "slow" : "healthy");

      if (error) {
        console.error("n8n Error:", { error, responseTime, attempt: retryAttempt + 1 });

        const errorMsg = error.message?.toLowerCase() || "";
        if (errorMsg.includes("500") || errorMsg.includes("internal server")) {
          // Save offline
          setN8nStatus("down");
          setOfflineMode(true);
          const audioData = await blobToBase64(audioBlob);
          const failed: FailedRecording = {
            id: crypto.randomUUID(),
            audioData,
            timestamp: new Date().toISOString(),
            duration: recordingDuration,
            attempts: retryAttempt + 1,
            lastAttempt: new Date().toISOString(),
          };
          saveFailedRecordings([...failedRecordings, failed]);
          toast({
            title: "Working Offline",
            description: "Saved locally. Will retry when service is back.",
            variant: "destructive",
          });
          return false;
        }

        // Other errors → retry
        if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
          const delays = [0, 5000, 30000];
          await new Promise((r) => setTimeout(r, delays[retryAttempt]));
          return sendAudioToN8n(audioBlob, retryAttempt + 1);
        }

        // Max retries exceeded → save locally
        const audioData = await blobToBase64(audioBlob);
        const failed: FailedRecording = {
          id: crypto.randomUUID(),
          audioData,
          timestamp: new Date().toISOString(),
          duration: recordingDuration,
          attempts: MAX_RETRY_ATTEMPTS,
          lastAttempt: new Date().toISOString(),
        };
        saveFailedRecordings([...failedRecordings, failed]);
        toast({
          title: "Upload Failed",
          description: "Saved locally. Use 'Retry Failed Uploads' later.",
          variant: "destructive",
        });
        return false;
      }

      // Debug: Log raw response from edge function
      console.log("📥 Raw n8n response:", data);
      
      // Extract data from nested output object if present
      const responseData = data?.output || data;
      
      console.log("📊 Parsed data:", {
        transcript: responseData?.transcript,
        findings: responseData?.findings,
        teethStatus: responseData?.teethStatus,
      });

      toast({
        title: "Recording Sent",
        description:
          retryAttempt > 0 ? "Recording uploaded successfully!" : "Voice recording sent to automation workflow",
      });

      // IMPORTANT: Pass n8n JSON back to the parent so Index can update the chart
      setTranscript(responseData?.transcript ?? "Voice recording processed");
      
      const resultData = {
        transcript: responseData?.transcript,
        findings: responseData?.findings ?? [],
        teethStatus: responseData?.teethStatus ?? [],
        summary: responseData?.summary,
      };
      
      console.log("🔄 Calling onRecordingComplete with:", resultData);
      onRecordingComplete?.(resultData);

      setOfflineMode(false);
      return true;
    } catch (error) {
      console.error("n8n Error (exception):", { error, attempt: retryAttempt + 1 });

      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        const delays = [0, 5000, 30000];
        await new Promise((r) => setTimeout(r, delays[retryAttempt]));
        return sendAudioToN8n(audioBlob, retryAttempt + 1);
      }

      // Save after max retries
      const audioData = await blobToBase64(audioBlob);
      const failed: FailedRecording = {
        id: crypto.randomUUID(),
        audioData,
        timestamp: new Date().toISOString(),
        duration: recordingDuration,
        attempts: MAX_RETRY_ATTEMPTS,
        lastAttempt: new Date().toISOString(),
      };
      saveFailedRecordings([...failedRecordings, failed]);

      setN8nStatus("down");
      setOfflineMode(true);
      toast({
        title: "Connection Error",
        description: "Saved locally. Will sync when connection is restored.",
        variant: "destructive",
      });

      return false;
    }
  };

  const retryFailedRecordings = async () => {
    if (failedRecordings.length === 0 || isRetrying) return;
    setIsRetrying(true);
    const remaining: FailedRecording[] = [];

    for (const recording of failedRecordings) {
      try {
        const blob = base64ToBlob(recording.audioData);
        const success = await sendAudioToN8n(blob, recording.attempts);
        if (!success) {
          remaining.push({
            ...recording,
            attempts: recording.attempts + 1,
            lastAttempt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error retrying recording:", error);
        remaining.push(recording);
      }
    }

    saveFailedRecordings(remaining);
    setIsRetrying(false);

    if (remaining.length === 0) {
      toast({ title: "All Recordings Uploaded", description: "All offline recordings synced!" });
      setOfflineMode(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if ((window as any).recordingTimer) {
        clearInterval((window as any).recordingTimer);
        (window as any).recordingTimer = null;
      }
      toast({ title: "Recording Stopped", description: "Processing and sending to automation..." });
    } catch (error) {
      console.error("Error stopping recording:", error);
      toast({ title: "Error", description: "Failed to stop recording", variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => {
      if ((window as any).recordingTimer) clearInterval((window as any).recordingTimer);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="flex flex-col items-center space-y-6">
        {/* Status */}
        <div className="w-full flex items-center justify-between">
          <Badge
            variant={n8nStatus === "healthy" ? "default" : n8nStatus === "slow" ? "secondary" : "destructive"}
            className="flex items-center gap-2"
          >
            {n8nStatus === "healthy" && <Wifi className="w-3 h-3" />}
            {n8nStatus === "slow" && <AlertCircle className="w-3 h-3" />}
            {n8nStatus === "down" && <WifiOff className="w-3 h-3" />}
            {n8nStatus === "healthy" && "Service Online"}
            {n8nStatus === "slow" && "Service Slow"}
            {n8nStatus === "down" && "Service Offline"}
          </Badge>

          {failedRecordings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={retryFailedRecordings}
              disabled={isRetrying}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
              Retry Failed ({failedRecordings.length})
            </Button>
          )}
        </div>

        {/* Offline banner */}
        {offlineMode && (
          <Alert variant="destructive" className="w-full">
            <WifiOff className="h-4 w-4" />
            <AlertDescription>Working offline - recordings will sync when connection is restored</AlertDescription>
          </Alert>
        )}

        {/* Record/Stop */}
        <div className="relative">
          {isRecording ? (
            <Button
              size="lg"
              variant="destructive"
              onClick={stopRecording}
              className="w-32 h-32 rounded-full text-lg font-semibold shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <Square className="w-8 h-8" />
                <span>Stop</span>
              </div>
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={startRecording}
              disabled={isProcessing}
              className="w-32 h-32 rounded-full text-lg font-semibold shadow-lg bg-primary hover:bg-primary/90"
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Mic className="w-8 h-8" />
                  <span>Record</span>
                </div>
              )}
            </Button>
          )}

          {isRecording && (
            <div className="absolute inset-0 -m-4 pointer-events-none">
              <div className="w-full h-full rounded-full bg-recording-glow animate-pulse-recording" />
            </div>
          )}
        </div>

        {/* Waveform */}
        {isRecording && (
          <div className="w-full max-w-md space-y-4">
            <canvas
              ref={canvasRef}
              width={600}
              height={100}
              className="w-full h-24 bg-card rounded-lg border border-border"
            />
            <div className="text-2xl font-mono font-bold text-recording text-center">
              {formatDuration(recordingDuration)}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !isProcessing && !transcript && (
          <p className="text-muted-foreground text-center max-w-md">
            Click the record button and speak your dental findings. The AI will process your voice and update the chart
            automatically.
          </p>
        )}

        {/* Transcript and AI confirmation (optional) */}
        {transcript && (
          <div className="w-full space-y-4">
            <div className="bg-accent rounded-lg p-4">
              <h3 className="text-sm font-semibold text-accent-foreground mb-2">Your Recording:</h3>
              <p className="text-foreground">{transcript}</p>
            </div>

            {aiResponse && (
              <div className="bg-secondary/10 border border-secondary rounded-lg p-4">
                <h3 className="text-sm font-semibold text-secondary mb-2">AI Confirmation:</h3>
                <p className="text-foreground">{aiResponse}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
