import { Finding } from "@/types/dental";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FindingsPanelProps {
  findings: Finding[];
  onDeleteFinding: (id: string) => void;
  onExportPDF: () => void;
  onSendToN8n: () => void;
}

export const FindingsPanel = ({ 
  findings, 
  onDeleteFinding, 
  onExportPDF,
  onSendToN8n 
}: FindingsPanelProps) => {
  const { toast } = useToast();

  const getConditionLabel = (condition: string) => {
    return condition
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      healthy: "text-status-healthy",
      removed: "text-status-removed",
      cavity: "text-status-cavity",
      crown: "text-status-crown",
      "root-canal": "text-status-rootCanal",
      cracked: "text-status-cracked",
      filling: "text-status-filling",
    };
    return colors[condition] || "text-foreground";
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-foreground">Findings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {findings.length} {findings.length === 1 ? 'finding' : 'findings'} recorded
        </p>
      </div>

      <ScrollArea className="flex-1 p-6">
        {findings.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No findings recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Use voice recording or click teeth to add findings
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map((finding) => (
              <div
                key={finding.id}
                className="bg-muted/50 rounded-lg p-4 border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        Tooth {finding.toothNumber}
                      </span>
                      <span className={`text-sm font-medium ${getConditionColor(finding.condition)}`}>
                        {getConditionLabel(finding.condition)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(finding.timestamp).toLocaleTimeString()}
                    </p>
                    {finding.notes && (
                      <p className="text-sm text-foreground mt-2">{finding.notes}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteFinding(finding.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-6 border-t border-border space-y-3">
        <Button
          onClick={onExportPDF}
          disabled={findings.length === 0}
          className="w-full gap-2"
          variant="outline"
        >
          <FileText className="w-4 h-4" />
          Export PDF
        </Button>
        <Button
          onClick={onSendToN8n}
          disabled={findings.length === 0}
          className="w-full gap-2"
        >
          <Send className="w-4 h-4" />
          Send to n8n
        </Button>
      </div>
    </div>
  );
};
