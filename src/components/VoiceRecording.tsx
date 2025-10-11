import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setTranscript("");
      setAiResponse("");
      setRecordingDuration(0);

      // Start timer
      const timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // TODO: Implement Livekit voice recording
      toast({
        title: "Recording Started",
        description: "Speak your dental findings...",
      });

      // Store timer for cleanup
      (window as any).recordingTimer = timer;
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    console.log("stopRecording called");
    console.log("Timer before clear:", (window as any).recordingTimer);
    try {
      console.log("Setting isRecording to false");
      setIsRecording(false);

      // Clear timer
      if ((window as any).recordingTimer) {
        console.log("Clearing timer...");
        clearInterval((window as any).recordingTimer);
        (window as any).recordingTimer = null;
        console.log("Timer cleared");
      } else {
        console.log("No timer found to clear");
      }

      toast({
        title: "Recording Stopped",
        description: "Recording has been cancelled",
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
            <div className="absolute inset-0 -m-4">
              <div className="w-full h-full rounded-full bg-recording-glow animate-pulse-recording" />
            </div>
          )}
        </div>

        {/* Recording Duration */}
        {isRecording && (
          <div className="text-2xl font-mono font-bold text-recording">
            {formatDuration(recordingDuration)}
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
