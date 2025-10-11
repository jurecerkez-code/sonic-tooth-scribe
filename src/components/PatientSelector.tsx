import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import type { Patient } from "@/types/enhanced-dental";

interface PatientSelectorProps {
  onSelectPatient: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

export const PatientSelector = ({ onSelectPatient, selectedPatient }: PatientSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);

  const handleSearch = async () => {
    // Placeholder: Will connect to Weaviate API
    console.log("Searching for patient:", searchQuery);
    // Mock results for now
    setSearchResults([
      { id: "1", name: "John Doe", dateOfBirth: "1980-01-15" },
      { id: "2", name: "Jane Smith", dateOfBirth: "1992-05-20" },
    ]);
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search patient by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {selectedPatient && (
        <div className="p-3 bg-primary/10 rounded-md">
          <p className="font-semibold">{selectedPatient.name}</p>
          {selectedPatient.dateOfBirth && (
            <p className="text-sm text-muted-foreground">DOB: {selectedPatient.dateOfBirth}</p>
          )}
        </div>
      )}

      {searchResults.length > 0 && !selectedPatient && (
        <div className="space-y-2">
          {searchResults.map((patient) => (
            <div
              key={patient.id}
              className="p-3 border rounded-md hover:bg-accent cursor-pointer"
              onClick={() => onSelectPatient(patient)}
            >
              <p className="font-medium">{patient.name}</p>
              {patient.dateOfBirth && (
                <p className="text-sm text-muted-foreground">DOB: {patient.dateOfBirth}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
