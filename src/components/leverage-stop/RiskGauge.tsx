import { RiskLevel } from '@/utils/leverageCalculations';

interface RiskGaugeProps {
  riskLevel: RiskLevel;
  leverage: number;
  marginPct: number;
}

export function RiskGauge({ riskLevel, leverage, marginPct }: RiskGaugeProps) {
  // Map risk to 0-100 score
  const riskScore = Math.min(100, (leverage / 100) * 60 + (marginPct < 0.5 ? 40 : 0));
  
  const getColor = () => {
    if (riskLevel === "Low") return "text-success";
    if (riskLevel === "Medium") return "text-warning";
    return "text-destructive";
  };

  const getBgColor = () => {
    if (riskLevel === "Low") return "bg-success";
    if (riskLevel === "Medium") return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Risk Assessment</span>
        <span className={`text-sm font-bold ${getColor()}`}>{riskLevel}</span>
      </div>
      
      {/* Risk bar */}
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${getBgColor()}`}
          style={{ width: `${riskScore}%` }}
        />
      </div>

      {/* Circular gauge */}
      <div className="flex justify-center py-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-secondary"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${(riskScore / 100) * 251.2} 251.2`}
              className={getColor()}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getColor()}`}>
                {Math.round(riskScore)}
              </div>
              <div className="text-xs text-muted-foreground">Risk Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
