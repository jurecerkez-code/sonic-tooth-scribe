import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, CheckCircle, AlertCircle } from "lucide-react";
import type { EnhancedFinding } from "@/types/enhanced-dental";

interface EnhancedFindingsPanelProps {
  findings: EnhancedFinding[];
  onDeleteFinding: (id: string) => void;
  onVerifyFinding: (id: string) => void;
}

export const EnhancedFindingsPanel = ({ findings, onDeleteFinding, onVerifyFinding }: EnhancedFindingsPanelProps) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Session Findings</h2>
      
      {findings.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No findings recorded yet</p>
      ) : (
        <div className="space-y-3">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className={`p-4 rounded-lg border ${finding.flagged ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-border'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">Tooth #{finding.toothNumber}</span>
                    <Badge variant={finding.verified ? "default" : "secondary"}>
                      {finding.condition}
                    </Badge>
                    {finding.verified && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {finding.flagged && <AlertCircle className="h-4 w-4 text-red-600" />}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <span className={getConfidenceColor(finding.confidence)}>
                      Confidence: {finding.confidence}%
                    </span>
                    <span>{new Date(finding.timestamp).toLocaleTimeString()}</span>
                  </div>

                  {finding.transcript && (
                    <p className="text-sm italic text-muted-foreground mb-2">
                      "{finding.transcript}"
                    </p>
                  )}

                  {finding.notes && (
                    <p className="text-sm">{finding.notes}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  {!finding.verified && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVerifyFinding(finding.id)}
                    >
                      Verify
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteFinding(finding.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
