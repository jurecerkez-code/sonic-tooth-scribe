import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User } from "lucide-react";
import type { Session } from "@/types/enhanced-dental";

interface SessionHistoryProps {
  onLoadSession: (session: Session) => void;
}

export const SessionHistory = ({ onLoadSession }: SessionHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);

  const handleSearch = async () => {
    // Placeholder: Will connect to Weaviate semantic search
    console.log("Searching sessions:", searchQuery);
    // Mock sessions for now
    setSessions([]);
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Session History</h2>
      
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search by patient, condition, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No sessions found. Search to view history.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
              onClick={() => onLoadSession(session)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{session.patientName}</span>
                <span className="text-sm text-muted-foreground">{session.date}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {session.dentistName}
                </span>
                <span>{session.findings.length} findings</span>
                <span>{session.sessionType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
