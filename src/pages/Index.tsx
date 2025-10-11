import { useState, useEffect } from "react";
import { DentalChart } from "@/components/DentalChart";
import { PatientInfo } from "@/components/PatientInfo";
import { VoiceRecording } from "@/components/VoiceRecording";
import { FindingsPanel } from "@/components/FindingsPanel";
import { ToothSelector } from "@/components/ToothSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ToothCondition, PatientInfo as PatientInfoType, Finding } from "@/types/dental";
import { Undo2, Redo2, Moon, Sun, Play } from "lucide-react";

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
      description: "Chart cleared for new patient",
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

            {/* Findings Panel */}
            <div className="lg:col-span-1">
              <FindingsPanel
                findings={findings}
                onDeleteFinding={handleDeleteFinding}
                onExportPDF={handleExportPDF}
                onSendToN8n={handleSendToN8n}
              />
            </div>
          </div>

          {/* Voice Recording */}
          <VoiceRecording onRecordingComplete={handleRecordingComplete} />
        </div>
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
