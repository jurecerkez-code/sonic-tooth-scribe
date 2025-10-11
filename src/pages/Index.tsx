import { useState, useEffect } from "react";
import { DentalChart } from "@/components/DentalChart";
import { PatientInfo } from "@/components/PatientInfo";
import { VoiceRecording } from "@/components/VoiceRecording";
import { FindingsPanel } from "@/components/FindingsPanel";
import { ToothSelector } from "@/components/ToothSelector";
import { PatientList } from "@/components/PatientList";
import { PatientSelector } from "@/components/PatientSelector";
import { StaffSelector } from "@/components/StaffSelector";
import { EnhancedFindingsPanel } from "@/components/EnhancedFindingsPanel";
import { SessionHistory } from "@/components/SessionHistory";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ToothCondition, PatientInfo as PatientInfoType, Finding } from "@/types/dental";
import { Patient, Dentist, Clinic, Session, EnhancedFinding } from "@/types/enhanced-dental";
import { Undo2, Redo2, Moon, Sun, Play, RotateCcw } from "lucide-react";

interface StoredPatient {
  patientInfo: PatientInfoType;
  teethStatus: [number, ToothCondition][];
  findings: Finding[];
}

const Index = () => {
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [teethStatus, setTeethStatus] = useState<Map<number, ToothCondition>>(new Map());
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [history, setHistory] = useState<Map<number, ToothCondition>[]>([new Map()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [patientInfo, setPatientInfo] = useState<PatientInfoType>({
    name: "",
    sessionId: `SESSION-${Date.now()}`,
    date: new Date().toISOString(),
  });
  const [allPatients, setAllPatients] = useState<StoredPatient[]>([]);
  
  // Enhanced session state
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [enhancedFindings, setEnhancedFindings] = useState<EnhancedFinding[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Load patients from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dentalPatients");
    if (stored) {
      setAllPatients(JSON.parse(stored));
    }
  }, []);

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

  const handleNewPatient = () => {
    // Save current patient if they have data
    if (findings.length > 0 || teethStatus.size > 0) {
      const currentPatient: StoredPatient = {
        patientInfo,
        teethStatus: Array.from(teethStatus.entries()),
        findings,
      };
      
      const updatedPatients = [...allPatients, currentPatient];
      setAllPatients(updatedPatients);
      localStorage.setItem("dentalPatients", JSON.stringify(updatedPatients));
    }

    // Reset for new patient
    setTeethStatus(new Map());
    setFindings([]);
    setHistory([new Map()]);
    setHistoryIndex(0);
    setPatientInfo({
      name: "",
      sessionId: `SESSION-${Date.now()}`,
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

  const handleSendToN8n = () => {
    toast({
      title: "Sending to n8n",
      description: "Data transmission feature coming soon",
    });
  };

  const handleDeleteFinding = (id: string) => {
    setFindings(findings.filter(f => f.id !== id));
    toast({
      title: "Finding Deleted",
      description: "Finding removed from list",
    });
  };

  const handleStartSession = () => {
    if (!selectedPatient || !selectedDentist || !selectedClinic) {
      toast({
        title: "Missing Information",
        description: "Please select patient, dentist, and clinic to start session",
        variant: "destructive",
      });
      return;
    }
    setSessionStarted(true);
    setPatientInfo({
      name: selectedPatient.name,
      sessionId: `SESSION-${Date.now()}`,
      date: new Date().toISOString(),
    });
    toast({
      title: "Session Started",
      description: `New session started for ${selectedPatient.name}`,
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
                <Redo2 className="w-5 h-5" />
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
            {!sessionStarted ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <PatientSelector
                    selectedPatient={selectedPatient}
                    onSelectPatient={setSelectedPatient}
                  />
                  <StaffSelector
                    selectedDentist={selectedDentist}
                    selectedClinic={selectedClinic}
                    onSelectDentist={setSelectedDentist}
                    onSelectClinic={setSelectedClinic}
                  />
                </div>
                <div className="flex justify-center">
                  <Button size="lg" onClick={handleStartSession}>
                    Start Session
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Patient Info */}
                <PatientInfo
                  patientInfo={patientInfo}
                  onPatientNameChange={(name) => setPatientInfo({ ...patientInfo, name })}
                  onNewPatient={handleNewPatient}
                />

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

                {/* Legacy Patient List */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Previous Patients (Legacy)</h3>
                  <PatientList 
                    patients={allPatients}
                    onLoadPatient={handleLoadPatient}
                  />
                </div>
              </div>
            )}
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
