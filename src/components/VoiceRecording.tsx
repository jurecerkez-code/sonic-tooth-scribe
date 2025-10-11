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
};
