import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PatientInfo as PatientInfoType } from "@/types/dental";
import { User, Calendar, Hash } from "lucide-react";

interface PatientInfoProps {
  patientInfo: PatientInfoType;
  onPatientNameChange: (name: string) => void;
  onNewPatient: () => void;
}

export const PatientInfo = ({ 
  patientInfo, 
  onPatientNameChange, 
  onNewPatient 
}: PatientInfoProps) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Patient Information</h2>
        <Button 
          variant="outline" 
          onClick={onNewPatient}
          className="gap-2"
        >
          <User className="w-4 h-4" />
          New Patient
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="patient-name" className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4" />
            Patient Name
          </Label>
          <Input
            id="patient-name"
            value={patientInfo.name}
            onChange={(e) => onPatientNameChange(e.target.value)}
            placeholder="Enter patient name"
            className="text-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Date & Time
            </Label>
            <div className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
              {new Date(patientInfo.date).toLocaleString()}
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4" />
              Session ID
            </Label>
            <div className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2 font-mono">
              {patientInfo.sessionId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
