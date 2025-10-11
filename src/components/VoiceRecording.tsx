import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VoiceRecordingProps {
  onRecordingComplete: (transcript: string) => void;
}

export const VoiceRecording = ({ onRecordingComplete }: VoiceRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { toast } = useToast();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas with background color
      canvasCtx.fillStyle = '#000000';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      canvasCtx.lineWidth = 3;
      canvasCtx.strokeStyle = '#22c55e';
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

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript("");
      setAiResponse("");
      setRecordingDuration(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analysis for waveform
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;

      drawWaveform();

      // Set up MediaRecorder with MP3 format (preferred)
      // Try MP3 first, fallback to webm if not supported
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Create blob with the recorded mime type
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioToN8n(audioBlob);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };

      mediaRecorderRef.current.start();

      // Start timer
      const timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak your dental findings...",
      });

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

  const sendAudioToN8n = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Validate audio format
      const supportedFormats = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 
                                'audio/m4a', 'audio/mp4', 'audio/mpga', 'audio/oga', 'audio/webm'];
      
      if (!supportedFormats.some(format => audioBlob.type.includes(format.split('/')[1]))) {
        toast({
          title: "Unsupported Format",
          description: "Please use MP3 format for voice recordings. Other supported formats are wav, ogg, flac, m4a, mp4, mpeg, mpga, oga, webm.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      await new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1];
            
            // Determine file extension based on mime type
            const fileExtension = audioBlob.type.includes('mp4') || audioBlob.type.includes('mpeg') 
              ? 'mp3' 
              : audioBlob.type.split('/')[1] || 'mp3';
            
            const sessionData = {
              type: 'voice_recording',
              timestamp: new Date().toISOString(),
              audioData: base64Audio,
              duration: recordingDuration,
              format: 'audio/mp3',
              mimeType: audioBlob.type,
              extension: fileExtension,
            };

            console.log('Sending audio to n8n:', {
              format: sessionData.format,
              mimeType: sessionData.mimeType,
              extension: sessionData.extension,
              size: audioBlob.size
            });

            const { data, error } = await supabase.functions.invoke('send-to-n8n', {
              body: sessionData,
            });

            if (error) {
              console.error("Supabase function error:", error);
              
              // Check for format-related errors
              if (error.message?.toLowerCase().includes('format') || 
                  error.message?.toLowerCase().includes('unsupported')) {
                toast({
                  title: "Format Error",
                  description: "Voice upload failed: Unsupported file format. Please record or upload your audio as an MP3 file for best results.",
                  variant: "destructive",
                });
              }
              reject(error);
              return;
            }

            toast({
              title: "Recording Sent",
              description: "Voice recording sent successfully to automation workflow",
            });

            setTranscript("Voice recording sent for processing");
            onRecordingComplete("Voice recording processed");
            resolve(data);
          } catch (err) {
            console.error("Error in sendAudioToN8n:", err);
            reject(err);
          }
        };
      });
    } catch (error) {
      console.error("Error sending audio:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      // Enhanced error messages
      let errorDescription = "Failed to send recording. Please try again.";
      
      if (errorMessage.includes("404")) {
        errorDescription = "Automation workflow not active. Please activate the workflow in n8n and try again.";
      } else if (errorMessage.includes("Webhook")) {
        errorDescription = "Webhook configuration error. Please check your automation settings.";
      } else if (errorMessage.toLowerCase().includes('format') || 
                 errorMessage.toLowerCase().includes('unsupported')) {
        errorDescription = "Voice upload failed: Unsupported file format. Please record your audio as MP3 for best results.";
      } else if (errorMessage.includes("500")) {
        errorDescription = "Server error processing audio. Ensure n8n is configured to accept 'audio' binary data and OpenAI can process the format.";
      }
      
      toast({
        title: "Error Sending Recording",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if ((window as any).recordingTimer) {
        clearInterval((window as any).recordingTimer);
        (window as any).recordingTimer = null;
      }

      toast({
        title: "Recording Stopped",
        description: "Processing and sending to automation...",
      });
    } catch (error) {
      console.error("Error stopping recording:", error);
      toast({
        title: "Error",
        description: "Failed to stop recording",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    return () => {
      if ((window as any).recordingTimer) {
        clearInterval((window as any).recordingTimer);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="flex flex-col items-center space-y-6">
        {/* Recording Button */}
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

          {/* Recording Indicator */}
          {isRecording && (
            <div className="absolute inset-0 -m-4 pointer-events-none">
              <div className="w-full h-full rounded-full bg-recording-glow animate-pulse-recording" />
            </div>
          )}
        </div>

        {/* Waveform Visualization */}
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
            Click the record button and speak your dental findings. The AI will process your voice and update the chart automatically.
          </p>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="w-full space-y-4">
            <div className="bg-accent rounded-lg p-4">
              <h3 className="text-sm font-semibold text-accent-foreground mb-2">
                Your Recording:
              </h3>
              <p className="text-foreground">{transcript}</p>
            </div>

            {aiResponse && (
              <div className="bg-secondary/10 border border-secondary rounded-lg p-4">
                <h3 className="text-sm font-semibold text-secondary mb-2">
                  AI Confirmation:
                </h3>
                <p className="text-foreground">{aiResponse}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
