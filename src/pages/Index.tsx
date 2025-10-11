import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DentalChart } from "@/components/DentalChart";
import { PatientInfo } from "@/components/PatientInfo";
import { VoiceRecording } from "@/components/VoiceRecording";
import { FindingsPanel } from "@/components/FindingsPanel";
import { ToothSelector } from "@/components/ToothSelector";
import { PatientList } from "@/components/PatientList";
import { EnhancedFindingsPanel } from "@/components/EnhancedFindingsPanel";
import { SessionHistory } from "@/components/SessionHistory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useDentalData } from "@/hooks/useDentalData";
import { ToothCondition, PatientInfo as PatientInfoType, Finding } from "@/types/dental";
import { Patient, Session, EnhancedFinding } from "@/types/enhanced-dental";
import { Undo2, Redo2, Moon, Sun, Play, RotateCcw, Send, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface StoredPatient {
  patientInfo: PatientInfoType;
  teethStatus: [number, ToothCondition][];
  findings: Finding[];
}

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { loading, createPatient, saveSession, getPatients } = useDentalData();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [teethStatus, setTeethStatus] = useState<Map<number, ToothCondition>>(new Map());
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [history, setHistory] = useState<Map<number, ToothCondition>[]>([new Map()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [patientInfo, setPatientInfo] = useState<PatientInfoType>({
    name: "",
    sessionId: `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
  });
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  
  // Enhanced session state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [enhancedFindings, setEnhancedFindings] = useState<EnhancedFinding[]>([]);

  // Load patients from database on mount
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    const patients = await getPatients();
    setAllPatients(patients || []);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
  };

  const updateToothStatus = (toothNumber: number, condition: ToothCondition, notes?: string) => {
    const newStatus = new Map(teethStatus);
    newStatus.set(toothNumber, condition);
    setTeethStatus(newStatus);

    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(new Map(newStatus));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Add finding
    const finding: Finding = {
      id: `${Date.now()}-${toothNumber}`,
      toothNumber,
      condition,
      timestamp: new Date().toISOString(),
      notes,
    };
    setFindings([...findings, finding]);

    // Add to enhanced findings with high confidence since it's manually entered
    const enhancedFinding: EnhancedFinding = {
      id: `${Date.now()}-${toothNumber}`,
      toothNumber,
      condition,
      confidence: 100, // Manual entry = 100% confidence
      verified: true, // Manual entry is automatically verified
      flagged: false,
      notes,
      timestamp: new Date().toISOString(),
    };
    setEnhancedFindings([...enhancedFindings, enhancedFinding]);

    toast({
      title: "Tooth Updated",
      description: `Tooth ${toothNumber} marked as ${condition}`,
    });
  };

  const handleRecordingComplete = (transcript: string) => {
    // TODO: Parse transcript and update dental chart
    // This is a placeholder - real implementation would use AI to parse
    console.log("Processing transcript:", transcript);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTeethStatus(new Map(history[historyIndex - 1]));
      toast({
        title: "Undo",
        description: "Last change reverted",
      });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTeethStatus(new Map(history[historyIndex + 1]));
      toast({
        title: "Redo",
        description: "Change reapplied",
      });
    }
  };

  const handleNewPatient = async () => {
    // Save current session if there's data
    if (currentPatientId && (findings.length > 0 || teethStatus.size > 0)) {
      await saveSession(currentPatientId, teethStatus, findings);
    }

    // Reset for new patient
    setTeethStatus(new Map());
    setFindings([]);
    setEnhancedFindings([]);
    setHistory([new Map()]);
    setHistoryIndex(0);
    setCurrentPatientId(null);
    setSelectedPatient(null);
    setPatientInfo({
      name: "",
      sessionId: `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
    });
    toast({
      title: "New Patient",
      description: "Previous patient saved. Ready for new patient.",
    });
  };

  const handleLoadPatient = (patient: StoredPatient) => {
    setPatientInfo(patient.patientInfo);
    setTeethStatus(new Map(patient.teethStatus));
    setFindings(patient.findings);
    setHistory([new Map(patient.teethStatus)]);
    setHistoryIndex(0);
    
    toast({
      title: "Patient Loaded",
      description: `Loaded ${patient.patientInfo.name || "patient"} record`,
    });
  };

  const handleDemoMode = () => {
    const demoData = new Map<number, ToothCondition>([
      [1, "removed"],
      [8, "cracked"],
      [14, "cavity"],
      [19, "crown"],
      [32, "removed"],
    ]);
    setTeethStatus(demoData);

    const demoFindings: Finding[] = [
      { id: "demo-1", toothNumber: 1, condition: "removed", timestamp: new Date().toISOString() },
      { id: "demo-2", toothNumber: 8, condition: "cracked", timestamp: new Date().toISOString() },
      { id: "demo-3", toothNumber: 14, condition: "cavity", timestamp: new Date().toISOString() },
      { id: "demo-4", toothNumber: 19, condition: "crown", timestamp: new Date().toISOString() },
      { id: "demo-5", toothNumber: 32, condition: "removed", timestamp: new Date().toISOString() },
    ];
    setFindings(demoFindings);

    toast({
      title: "Demo Mode",
      description: "Sample data loaded",
    });
  };

  const handleExportPDF = () => {
    toast({
      title: "Export PDF",
      description: "PDF export feature coming soon",
    });
  };

  const handleSendToN8n = async () => {
    if (enhancedFindings.length === 0) {
      toast({
        title: "No Session Data",
        description: "Please add findings before sending to automation",
        variant: "destructive",
      });
      return;
    }

    try {
      const sessionData = {
        sessionId: patientInfo.sessionId,
        date: patientInfo.date,
        patientInfo: {
          name: selectedPatient?.name || patientInfo.name,
          id: selectedPatient?.id,
          dateOfBirth: selectedPatient?.dateOfBirth,
          contact: selectedPatient?.contact,
        },
        findings: enhancedFindings.map(f => ({
          id: f.id,
          toothNumber: f.toothNumber,
          condition: f.condition,
          confidence: f.confidence,
          verified: f.verified,
          flagged: f.flagged,
          timestamp: f.timestamp,
          notes: f.notes,
          transcript: f.transcript,
        })),
        teethStatus: Array.from(teethStatus.entries()),
      };

      const { data, error } = await supabase.functions.invoke('send-to-n8n', {
        body: sessionData,
      });

      if (error) throw error;

      toast({
        title: "Sent to Automation",
        description: "Session data successfully sent to n8n workflow",
      });
    } catch (error) {
      console.error("Error sending to n8n:", error);
      toast({
        title: "Error",
        description: "Failed to send session data to automation",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFinding = (id: string) => {
    setFindings(findings.filter(f => f.id !== id));
    toast({
      title: "Finding Deleted",
      description: "Finding removed from list",
    });
  };

  const handleVerifyFinding = (id: string) => {
    setEnhancedFindings(enhancedFindings.map(f => 
      f.id === id ? { ...f, verified: true, flagged: false } : f
    ));
    toast({
      title: "Finding Verified",
      description: "Finding has been verified",
    });
  };

  const handleDeleteEnhancedFinding = (id: string) => {
    setEnhancedFindings(enhancedFindings.filter(f => f.id !== id));
    toast({
      title: "Finding Deleted",
      description: "Finding removed from session",
    });
  };

  const handleLoadSession = (session: Session) => {
    console.log("Loading session:", session);
    toast({
      title: "Session Loaded",
      description: `Loaded session for ${session.patientName}`,
    });
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientInfo({
      name: patient.name,
      sessionId: `SESSION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">DentalChart AI</h1>
              <p className="text-sm text-muted-foreground mt-1">Professional Dental Charting System</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button
                variant="outline"
                onClick={handleNewPatient}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restart
              </Button>
              <Button
                variant="outline"
                onClick={handleDemoMode}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Demo Mode
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleUndo}
                disabled={historyIndex === 0}
              >
                <Undo2 className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
              >
              <LogOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                supabase.auth.signOut();
                navigate('/auth');
              }}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="session" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="session">Current Session</TabsTrigger>
            <TabsTrigger value="history">Session History</TabsTrigger>
          </TabsList>

          <TabsContent value="session" className="space-y-6">
            {/* Patient Info */}
            <div>
              <PatientInfo
                patientInfo={patientInfo}
                onPatientNameChange={(name) => setPatientInfo({ ...patientInfo, name })}
                onNewPatient={handleNewPatient}
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dental Chart */}
              <div className="lg:col-span-2">
                <DentalChart
                  teethStatus={teethStatus}
                  onToothClick={handleToothClick}
                />
              </div>

              {/* Enhanced Findings Panel */}
              <div className="lg:col-span-1">
                <EnhancedFindingsPanel
                  findings={enhancedFindings}
                  onDeleteFinding={handleDeleteEnhancedFinding}
                  onVerifyFinding={handleVerifyFinding}
                />
              </div>
            </div>

            {/* Voice Recording */}
            <VoiceRecording onRecordingComplete={handleRecordingComplete} />

            {/* Send to Automation */}
            {enhancedFindings.length > 0 && (
              <div className="flex justify-center">
                <Button 
                  onClick={handleSendToN8n}
                  className="gap-2"
                  size="lg"
                >
                  <Send className="w-4 h-4" />
                  Send Session to Automation
                </Button>
              </div>
            )}

            {/* Legacy Patient List */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Previous Patients (Legacy)</h3>
              <PatientList 
                patients={allPatients}
                onLoadPatient={handleLoadPatient}
              />
            </div>
          </TabsContent>

          <TabsContent value="history">
            <SessionHistory onLoadSession={handleLoadSession} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Tooth Selector Dialog */}
      <ToothSelector
        isOpen={selectedTooth !== null}
        toothNumber={selectedTooth}
        currentCondition={selectedTooth ? teethStatus.get(selectedTooth) || "healthy" : "healthy"}
        onClose={() => setSelectedTooth(null)}
        onSave={(condition, notes) => {
          if (selectedTooth) {
            updateToothStatus(selectedTooth, condition, notes);
            setSelectedTooth(null);
          }
        }}
      />
    </div>
  );
};

export default Index;
