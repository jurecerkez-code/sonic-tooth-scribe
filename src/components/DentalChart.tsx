import { ToothCondition } from "@/types/dental";

interface DentalChartProps {
  teethStatus: Map<number, ToothCondition>;
  onToothClick: (toothNumber: number) => void;
}

const getToothColor = (condition: ToothCondition): string => {
  const colors: Record<ToothCondition, string> = {
    healthy: "fill-status-healthy",
    removed: "fill-status-removed",
    cavity: "fill-status-cavity",
    crown: "fill-status-crown",
    "root-canal": "fill-status-rootCanal",
    cracked: "fill-status-cracked",
    filling: "fill-status-filling",
  };
  return colors[condition];
};

const Tooth = ({ 
  number, 
  condition, 
  onClick 
}: { 
  number: number; 
  condition: ToothCondition; 
  onClick: () => void;
}) => {
  return (
    <div 
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <svg 
        width="40" 
        height="60" 
        viewBox="0 0 40 60" 
        className="transition-transform hover:scale-110"
      >
        <path
          d="M20 5 Q10 10, 10 25 Q10 45, 15 55 Q20 60, 25 55 Q30 45, 30 25 Q30 10, 20 5 Z"
          className={`${getToothColor(condition)} stroke-border stroke-2 transition-colors`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-card-foreground">{number}</span>
      </div>
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs bg-card border border-border rounded px-2 py-1 whitespace-nowrap shadow-lg">
          Tooth {number}
        </span>
      </div>
    </div>
  );
};

export const DentalChart = ({ teethStatus, onToothClick }: DentalChartProps) => {
  const upperTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  const lowerTeeth = Array.from({ length: 16 }, (_, i) => i + 17);

  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="space-y-12">
        {/* Upper Arch */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">
            Upper Arch (Maxillary)
          </h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {upperTeeth.map((num) => (
              <Tooth
                key={num}
                number={num}
                condition={teethStatus.get(num) || "healthy"}
                onClick={() => onToothClick(num)}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-dashed border-border" />

        {/* Lower Arch */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 text-center">
            Lower Arch (Mandibular)
          </h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {lowerTeeth.map((num) => (
              <Tooth
                key={num}
                number={num}
                condition={teethStatus.get(num) || "healthy"}
                onClick={() => onToothClick(num)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-border">
        <h4 className="text-sm font-semibold text-foreground mb-3">Status Legend</h4>
        <div className="grid grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-healthy" />
            <span className="text-xs text-muted-foreground">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-removed" />
            <span className="text-xs text-muted-foreground">Removed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-cavity" />
            <span className="text-xs text-muted-foreground">Cavity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-crown" />
            <span className="text-xs text-muted-foreground">Crown</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-rootCanal" />
            <span className="text-xs text-muted-foreground">Root Canal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-cracked" />
            <span className="text-xs text-muted-foreground">Cracked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-status-filling" />
            <span className="text-xs text-muted-foreground">Filling</span>
          </div>
        </div>
      </div>
    </div>
  );
};
