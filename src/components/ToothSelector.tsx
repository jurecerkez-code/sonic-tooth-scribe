import { ToothCondition } from "@/types/dental";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface ToothSelectorProps {
  isOpen: boolean;
  toothNumber: number | null;
  currentCondition: ToothCondition;
  onClose: () => void;
  onSave: (condition: ToothCondition, notes?: string) => void;
}

const conditions: { value: ToothCondition; label: string; color: string }[] = [
  { value: "healthy", label: "Healthy", color: "bg-status-healthy" },
  { value: "removed", label: "Removed", color: "bg-status-removed" },
  { value: "cavity", label: "Cavity", color: "bg-status-cavity" },
  { value: "crown", label: "Crown", color: "bg-status-crown" },
  { value: "root-canal", label: "Root Canal", color: "bg-status-rootCanal" },
  { value: "cracked", label: "Cracked", color: "bg-status-cracked" },
  { value: "filling", label: "Filling", color: "bg-status-filling" },
];

export const ToothSelector = ({
  isOpen,
  toothNumber,
  currentCondition,
  onClose,
  onSave,
}: ToothSelectorProps) => {
  const [selectedCondition, setSelectedCondition] = useState<ToothCondition>(currentCondition);
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    onSave(selectedCondition, notes || undefined);
    setNotes("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tooth {toothNumber} - Update Status</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label className="mb-3 block">Select Condition</Label>
            <div className="grid grid-cols-2 gap-2">
              {conditions.map((condition) => (
                <Button
                  key={condition.value}
                  variant={selectedCondition === condition.value ? "default" : "outline"}
                  onClick={() => setSelectedCondition(condition.value)}
                  className="justify-start gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${condition.color}`} />
                  {condition.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes" className="mb-2 block">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional observations..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
