import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PatientInfo, ToothCondition, Finding } from "@/types/dental";
import { Patient } from "@/hooks/useDentalData";
import { Users, Calendar, FileText } from "lucide-react";

interface StoredPatient {
  patientInfo: PatientInfo;
  teethStatus: [number, ToothCondition][];
  findings: Finding[];
}

// Support both legacy localStorage patients and new database patients
type PatientRecord = StoredPatient | Patient;

interface PatientListProps {
  patients: PatientRecord[];
  onLoadPatient: (patient: PatientRecord) => void;
}

// Helper function to check if it's a database patient record
const isDatabasePatient = (patient: PatientRecord): patient is Patient => {
  return 'id' in patient && !('patientInfo' in patient);
};

export const PatientList = ({ patients, onLoadPatient }: PatientListProps) => {
  if (patients.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <Users className="w-12 h-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Previous Patients</h3>
          <p className="text-sm text-muted-foreground">
            Patient records will appear here after you start a new patient
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Previous Patients</h2>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {patients.map((patient, index) => {
            // Handle both database patients and legacy localStorage patients
            const isDbPatient = isDatabasePatient(patient);
            const patientName = isDbPatient ? patient.name : patient.patientInfo.name;
            const patientDate = isDbPatient ? patient.created_at : patient.patientInfo.date;
            const patientId = isDbPatient ? patient.id : patient.patientInfo.sessionId;
            const findingsCount = isDbPatient ? 0 : patient.findings.length;

            return (
              <Card
                key={`${patientId}-${index}`}
                className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onLoadPatient(patient)}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">
                      {patientName || `Patient #${patients.length - index}`}
                    </h3>
                    <Button variant="outline" size="sm">
                      Load
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(patientDate).toLocaleDateString()}
                    </div>
                    {!isDbPatient && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {findingsCount} findings
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {isDbPatient ? `Patient ID: ${patientId}` : `Session: ${patientId}`}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
