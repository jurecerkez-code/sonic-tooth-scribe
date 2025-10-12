import { DentalChart } from "./DentalChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, Activity } from "lucide-react";
import { ToothCondition } from "@/types/dental";

interface Finding {
  toothNumber: number;
  condition: string;
  notes: string;
  severity: "none" | "low" | "moderate" | "high";
  urgent: boolean;
  confidence: number;
}

const demoData = {
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
};

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
  const handleToothClick = (toothNumber: number) => {
    console.log("Tooth clicked:", toothNumber);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Dental Examination</h1>
        <p className="text-muted-foreground">Interactive Dental Chart with Demo Data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Dental Chart - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <DentalChart 
            teethStatus={demoData.teethStatus}
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
                  {demoData.summary.totalTeethExamined}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Healthy Teeth</span>
                <Badge variant="secondary" className="font-bold text-green-600 dark:text-green-400">
                  {demoData.summary.healthyTeeth}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Needing Treatment</span>
                <Badge variant="secondary" className="font-bold text-orange-600 dark:text-orange-400">
                  {demoData.summary.teethNeedingTreatment}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Urgent Findings</span>
                <Badge variant="destructive" className="font-bold">
                  {demoData.summary.urgentFindings}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Findings List */}
          <Card>
            <CardHeader>
              <CardTitle>Findings ({demoData.findings.length})</CardTitle>
              <CardDescription>Detected dental conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoData.findings.map((finding: Finding, index: number) => (
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
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transcript Section - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Transcript</CardTitle>
          <CardDescription>Original voice input from examination</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg border border-border">
            <p className="text-foreground italic">"{demoData.transcript}"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
