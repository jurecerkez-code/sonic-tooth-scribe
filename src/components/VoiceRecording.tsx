import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, RefreshCw, WifiOff, Wifi, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface VoiceRecordingProps {
  onRecordingComplete: (transcript: string) => void;
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
        console.error("Failed to parse stored recordings:", error);
      }
    }
  }, []);

  // Save failed recordings to localStorage
  useEffect(() => {
    if (failedRecordings.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(failedRecordings));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [failedRecordings]);

  // Auto-retry failed recordings
  useEffect(() => {
    if (failedRecordings.length > 0 && !autoRetryIntervalRef.current) {
      autoRetryIntervalRef.current = window.setInterval(() => {
        retryFailedRecordings();
      }, AUTO_RETRY_INTERVAL);
    } else if (failedRecordings.length === 0 && autoRetryIntervalRef.current) {
      clearInterval(autoRetryIntervalRef.current);
      autoRetryIntervalRef.current = null;
    }

    return () => {
      if (autoRetryIntervalRef.current) {
        clearInterval(autoRetryIntervalRef.current);
      }
    };
  }, [failedRecordings]);

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const saveFailedRecording = async (audioBlob: Blob, duration: number) => {
    const base64 = await blobToBase64(audioBlob);
    const newRecording: FailedRecording = {
      id: crypto.randomUUID(),
      audioData: base64,
      timestamp: new Date().toISOString(),
      duration,
      attempts: 0,
      lastAttempt: new Date().toISOString(),
    };
    setFailedRecordings((prev) => [...prev, newRecording]);
  };

  const sendAudioToN8n = async (
    audioBlob: Blob,
    duration: number,
    retryAttempt = 0
  ): Promise<boolean> => {
    const startTime = Date.now();

    try {
      const formData = new FormData();
      const mimeType = audioBlob.type || 'audio/webm';
      const extension = mimeType.split('/')[1] || 'webm';
      const file = new File([audioBlob], `input.${extension}`, { type: mimeType });
      
      formData.append('file', file);
      formData.append('timestamp', new Date().toISOString());
      formData.append('duration', duration.toString());
      formData.append('type', mimeType);

      const { data, error } = await supabase.functions.invoke('send-to-n8n', {
        body: formData,
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        throw error;
      }

      // Update status based on response time
      if (responseTime > 5000) {
        setN8nStatus("slow");
      } else {
        setN8nStatus("healthy");
      }

      setOfflineMode(false);

      if (data?.transcript) {
        setTranscript(data.transcript);
        onRecordingComplete(data.transcript);
      }

      if (data?.aiResponse) {
        setAiResponse(data.aiResponse);
      }

      toast({
        title: retryAttempt > 0 ? "Recording uploaded successfully!" : "Recording processed",
        description: "Your voice note has been transcribed.",
      });

      return true;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      console.error('n8n Error:', {
        status: error?.status || 'unknown',
        message: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        audioSize: audioBlob.size,
        audioType: audioBlob.type,
        responseTime,
      });

      // Update status
      if (error?.status === 500 || error?.message?.includes('500')) {
        setN8nStatus("down");
        setOfflineMode(true);
      }

      // Retry logic with exponential backoff
      if (retryAttempt < MAX_RETRY_ATTEMPTS) {
        const delays = [0, 5000, 30000]; // immediate, 5s, 30s
        const delay = delays[retryAttempt];

        toast({
          title: `Retrying upload... (Attempt ${retryAttempt + 2} of ${MAX_RETRY_ATTEMPTS + 1})`,
          description: delay > 0 ? `Waiting ${delay / 1000} seconds...` : "Retrying now...",
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
        return sendAudioToN8n(audioBlob, duration, retryAttempt + 1);
      }

      // Save to localStorage after all retries failed
      await saveFailedRecording(audioBlob, duration);

      toast({
        variant: "destructive",
        title: "Voice processing temporarily unavailable",
        description: "Your recording has been saved locally and will be processed when the service is restored.",
      });

      return false;
    }
  };

  const retryFailedRecordings = async () => {
    if (isRetrying || failedRecordings.length === 0) return;

    setIsRetrying(true);

    const updatedRecordings: FailedRecording[] = [];

    for (const recording of failedRecordings) {
      if (recording.attempts >= MAX_RETRY_ATTEMPTS) {
        updatedRecordings.push(recording);
        continue;
      }

      const audioBlob = base64ToBlob(recording.audioData, 'audio/webm');
      const success = await sendAudioToN8n(audioBlob, recording.duration, 0);

      if (!success) {
        updatedRecordings.push({
          ...recording,
          attempts: recording.attempts + 1,
          lastAttempt: new Date().toISOString(),
        });
      }
    }

    setFailedRecordings(updatedRecordings);
    setIsRetrying(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup audio context for visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 2048;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Determine supported MIME type
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg',
      ];
      
      const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!supportedMimeType) {
        throw new Error('No supported audio format found');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedMimeType });
        
        if (audioBlob.size === 0) {
          toast({
            variant: "destructive",
            title: "Recording failed",
            description: "No audio data captured. Please check your microphone permissions and try again.",
          });
          return;
        }

        if (audioBlob.size > 25 * 1024 * 1024) {
          toast({
            variant: "destructive",
            title: "Recording too large",
            description: "Recording exceeds 25MB limit. Please record a shorter message.",
          });
          return;
        }

        setIsProcessing(true);
        await sendAudioToN8n(audioBlob, recordingDuration);
        setIsProcessing(false);
        setRecordingDuration(0);

        stream.getTracks().forEach((track) => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start duration counter
      const startTime = Date.now();
      const durationInterval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);

      // Store interval for cleanup
      (mediaRecorder as any).durationInterval = durationInterval;

      // Start visualization
      if (canvasRef.current) {
        visualize();
      }

      toast({
        title: "Recording started",
        description: "Speak into your microphone",
      });
    } catch (error: any) {
      console.error("Error starting recording:", error);
      toast({
        variant: "destructive",
        title: "Recording failed",
        description: "Please check your microphone permissions and try again.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const durationInterval = (mediaRecorderRef.current as any).durationInterval;
      if (durationInterval) {
        clearInterval(durationInterval);
      }
      
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const visualize = () => {
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

      canvasCtx.fillStyle = "rgb(240, 240, 245)";
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = "rgb(59, 130, 246)";
      canvasCtx.beginPath();

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusIcon = () => {
    switch (n8nStatus) {
      case "healthy":
        return <Wifi className="h-4 w-4" />;
      case "slow":
        return <AlertCircle className="h-4 w-4" />;
      case "down":
        return <WifiOff className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (): "default" | "secondary" | "destructive" => {
    switch (n8nStatus) {
      case "healthy":
        return "default";
      case "slow":
        return "secondary";
      case "down":
        return "destructive";
    }
  };

  return (
    <div className="space-y-4">
      {offlineMode && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Working offline - recordings will sync when connection is restored
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            {getStatusIcon()}
            {n8nStatus === "healthy" && "Connected"}
            {n8nStatus === "slow" && "Slow connection"}
            {n8nStatus === "down" && "Offline"}
          </Badge>
          
          {failedRecordings.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={retryFailedRecordings}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry Failed Uploads ({failedRecordings.length})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center space-y-4">
        {isRecording && (
          <canvas
            ref={canvasRef}
            width={300}
            height={100}
            className="border rounded"
          />
        )}

        {isRecording && (
          <div className="text-lg font-semibold">
            {formatDuration(recordingDuration)}
          </div>
        )}

        <div className="flex gap-2">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isProcessing}
              size="lg"
              className="gap-2"
            >
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="destructive"
              size="lg"
              className="gap-2"
            >
              <Square className="h-5 w-5" />
              Stop Recording
            </Button>
          )}
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing your recording...
          </div>
        )}

        {transcript && (
          <div className="w-full p-4 bg-secondary rounded-lg">
            <h3 className="font-semibold mb-2">Transcript:</h3>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {aiResponse && (
          <div className="w-full p-4 bg-primary/10 rounded-lg">
            <h3 className="font-semibold mb-2">AI Response:</h3>
            <p className="text-sm">{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
};
