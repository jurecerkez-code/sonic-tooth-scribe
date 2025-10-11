import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { Dentist, Clinic } from "@/types/enhanced-dental";

interface StaffSelectorProps {
  selectedDentist: Dentist | null;
  selectedClinic: Clinic | null;
  onSelectDentist: (dentist: Dentist) => void;
  onSelectClinic: (clinic: Clinic) => void;
}

// Mock data - will be fetched from Weaviate
const mockDentists: Dentist[] = [
  { id: "d1", name: "Dr. Sarah Johnson", licenseNumber: "DDS12345" },
  { id: "d2", name: "Dr. Michael Chen", licenseNumber: "DDS67890" },
];

const mockClinics: Clinic[] = [
  { id: "c1", name: "Main Street Dental", address: "123 Main St" },
  { id: "c2", name: "Downtown Dental Care", address: "456 Oak Ave" },
];

export const StaffSelector = ({ selectedDentist, selectedClinic, onSelectDentist, onSelectClinic }: StaffSelectorProps) => {
  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Dentist</label>
        <Select
          value={selectedDentist?.id}
          onValueChange={(id) => {
            const dentist = mockDentists.find(d => d.id === id);
            if (dentist) onSelectDentist(dentist);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select dentist" />
          </SelectTrigger>
          <SelectContent>
            {mockDentists.map((dentist) => (
              <SelectItem key={dentist.id} value={dentist.id}>
                {dentist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Clinic</label>
        <Select
          value={selectedClinic?.id}
          onValueChange={(id) => {
            const clinic = mockClinics.find(c => c.id === id);
            if (clinic) onSelectClinic(clinic);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select clinic" />
          </SelectTrigger>
          <SelectContent>
            {mockClinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};
