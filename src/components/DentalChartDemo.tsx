import { useState } from "react";
import { DentalChart } from "./DentalChart";
import { VoiceRecording } from "./VoiceRecording";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle, Activity, Loader2 } from "lucide-react";
import { ToothCondition } from "@/types/dental";
import { useToast } from "@/hooks/use-toast";

interface Finding {
  toothNumber: number;
  condition: string;
  notes: string;
  severity: "none" | "low" | "moderate" | "high";
  urgent: boolean;
  confidence: number;
}

// Demo data as fallback
const getDemoData = () => ({
  transcript: "Tooth number 1 is removed and tooth 14 needs root canal checkup",
  findings: [
    {
      toothNumber: 1,
      condition: "missing",
      notes: "Tooth removed",
      severity: "none" as const,
      urgent: false,
      confidence: 95
    },
    {
      toothNumber: 14,
      condition: "root_canal_needed",
      notes: "Needs root canal checkup",
      severity: "moderate" as const,
      urgent: true,
      confidence: 95
    }
  ],
  teethStatus: new Map<number, ToothCondition>([
    [1, "removed"],
    [14, "root-canal"]
  ]),
  summary: {
    totalTeethExamined: 2,
    healthyTeeth: 0,
    teethNeedingTreatment: 1,
    urgentFindings: 1
  }
});

const getSeverityColor = (severity: string) => {
  const colors = {
    none: "bg-muted text-muted-foreground",
    low: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    moderate: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    high: "bg-red-500/10 text-red-700 dark:text-red-400"
  };
  return colors[severity as keyof typeof colors] || colors.none;
};

const getConditionIcon = (condition: string) => {
  switch (condition) {
    case "missing":
      return <XCircle className="w-5 h-5 text-muted-foreground" />;
    case "root_canal_needed":
      return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    default:
      return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
  }
};

export const DentalChartDemo = () => {
  const { toast } = useToast();
  const [dentalData, setDentalData] = useState(getDemoData());
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);

  const handleToothClick = (toothNumber: number) => {
    console.log("Tooth clicked:", toothNumber);
  };

  // Handle n8n webhook response
  const handleRecordingComplete = (result: any) => {
    console.log("🎯 DentalChartDemo received n8n response:", result);
    setIsLoading(false);
    setHasRecording(true);

    // Check if n8n returned empty/no data - use demo data as seed
    const hasN8nData = result.findings && result.findings.length > 0;
    
    if (!hasN8nData) {
      console.log("📦 No n8n data found, seeding with demo data");
      const demoData = getDemoData();
      setDentalData(demoData);
      toast({
        title: "✓ Demo Data Loaded",
        description: "Showing sample dental examination (tooth #1 removed, tooth #14 root canal)",
      });
      return;
    }

    // Parse and update dental data from n8n
    const newTeethStatus = new Map<number, ToothCondition>();
    
    if (result.teethStatus && Array.isArray(result.teethStatus)) {
      result.teethStatus.forEach(([toothNum, condition]: [number, ToothCondition]) => {
        newTeethStatus.set(toothNum, condition);
      });
    }

    // Map n8n response to our data structure
    const updatedData = {
      transcript: result.transcript || "",
      findings: result.findings || [],
      teethStatus: newTeethStatus,
      summary: result.summary || {
        totalTeethExamined: result.findings?.length || 0,
        healthyTeeth: 0,
        teethNeedingTreatment: result.findings?.filter((f: any) => f.condition !== "healthy").length || 0,
        urgentFindings: result.findings?.filter((f: any) => f.urgent).length || 0
      }
    };

    setDentalData(updatedData);
    
    toast({
      title: "✓ Dental Chart Updated!",
      description: `Found ${updatedData.findings.length} condition(s)`,
    });
  };

  const handleLoadDemoData = () => {
    setDentalData(getDemoData());
    setHasRecording(true);
    toast({
      title: "Demo Data Loaded",
      description: "Showing sample dental examination data",
    });
  };

  const handleClearData = () => {
    setDentalData({
      transcript: "",
      findings: [],
      teethStatus: new Map(),
      summary: {
        totalTeethExamined: 0,
        healthyTeeth: 0,
        teethNeedingTreatment: 0,
        urgentFindings: 0
      }
    });
    setHasRecording(false);
    toast({
      title: "Data Cleared",
      description: "Ready for new recording",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Dental Examination</h1>
        <p className="text-muted-foreground">
          {isLoading ? "Processing voice recording..." : hasRecording ? "Live Dental Chart Data" : "Record or load demo data"}
        </p>
      </div>

      {/* Voice Recording Section */}
      {!hasRecording && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Record Dental Findings</CardTitle>
            <CardDescription>
              Speak dental conditions (e.g., "Tooth 1 is removed, tooth 14 needs root canal")
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <VoiceRecording 
              onRecordingComplete={(result) => {
                setIsLoading(true);
                handleRecordingComplete(result);
              }} 
            />
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={handleLoadDemoData}>
                Load Demo Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-lg font-medium text-foreground">Analyzing recording...</p>
              <p className="text-sm text-muted-foreground">Processing dental findings</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dental Chart and Data Display */}
      {hasRecording && !isLoading && (
        <>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleLoadDemoData}>
              Load Demo Data
            </Button>
            <Button variant="outline" onClick={handleClearData}>
              Clear & Record New
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Dental Chart - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <DentalChart 
                teethStatus={dentalData.teethStatus}
                onToothClick={handleToothClick}
              />
            </div>

            {/* Right Sidebar - Summary and Findings */}
            <div className="space-y-6">
              {/* Summary Card */}
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Examination Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Total Teeth Examined</span>
                    <Badge variant="secondary" className="font-bold">
                      {dentalData.summary.totalTeethExamined}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Healthy Teeth</span>
                    <Badge variant="secondary" className="font-bold text-green-600 dark:text-green-400">
                      {dentalData.summary.healthyTeeth}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Needing Treatment</span>
                    <Badge variant="secondary" className="font-bold text-orange-600 dark:text-orange-400">
                      {dentalData.summary.teethNeedingTreatment}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                    <span className="text-sm font-medium text-red-700 dark:text-red-400">Urgent Findings</span>
                    <Badge variant="destructive" className="font-bold">
                      {dentalData.summary.urgentFindings}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Findings List */}
              <Card>
                <CardHeader>
                  <CardTitle>Findings ({dentalData.findings.length})</CardTitle>
                  <CardDescription>Detected dental conditions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dentalData.findings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No findings yet. Record a voice note to analyze.</p>
                  ) : (
                    dentalData.findings.map((finding: Finding, index: number) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 space-y-3 ${
                    finding.urgent
                      ? "border-orange-500/50 bg-orange-500/5 shadow-md"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getConditionIcon(finding.condition)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">
                          Tooth #{finding.toothNumber}
                        </h4>
                        {finding.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            URGENT
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {finding.condition.replace(/_/g, " ")}
                      </p>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Severity:</span>
                          <Badge className={`text-xs ${getSeverityColor(finding.severity)}`}>
                            {finding.severity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-medium text-foreground">{finding.confidence}%</span>
                        </div>
                        <div className="pt-1">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="text-foreground mt-1">{finding.notes}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                    </div>
                  ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Transcript Section - Full Width */}
          {dentalData.transcript && (
            <Card>
              <CardHeader>
                <CardTitle>Voice Transcript</CardTitle>
                <CardDescription>Original voice input from examination</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <p className="text-foreground italic">"{dentalData.transcript}"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
