import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import type { Patient } from "@/types/enhanced-dental";

interface PatientSelectorProps {
  onSelectPatient: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

const DEFAULT_PATIENTS: Patient[] = [
  { id: "1", name: "John Doe", dateOfBirth: "1980-01-15" },
  { id: "2", name: "Jane Smith", dateOfBirth: "1992-05-20" },
];

export const PatientSelector = ({ onSelectPatient, selectedPatient }: PatientSelectorProps) => {
  const [patients, setPatients] = useState<Patient[]>(DEFAULT_PATIENTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientDob, setNewPatientDob] = useState("");

  const handleAddPatient = () => {
    if (!newPatientName.trim()) return;

    const newPatient: Patient = {
      id: `${Date.now()}`,
      name: newPatientName.trim(),
      dateOfBirth: newPatientDob || undefined,
    };

    setPatients([...patients, newPatient]);
    setNewPatientName("");
    setNewPatientDob("");
    setIsDialogOpen(false);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Select Patient</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="patient-name">Patient Name</Label>
                <Input
                  id="patient-name"
                  placeholder="Enter patient name"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-dob">Date of Birth</Label>
                <Input
                  id="patient-dob"
                  type="date"
                  value={newPatientDob}
                  onChange={(e) => setNewPatientDob(e.target.value)}
                />
              </div>
              <Button onClick={handleAddPatient} className="w-full">
                Add Patient
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedPatient?.id === patient.id
                ? "bg-primary/10 border-primary"
                : "hover:bg-accent border-border"
            }`}
            onClick={() => onSelectPatient(patient)}
          >
            <p className="font-semibold">{patient.name}</p>
            {patient.dateOfBirth && (
              <p className="text-sm text-muted-foreground">DOB: {patient.dateOfBirth}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
