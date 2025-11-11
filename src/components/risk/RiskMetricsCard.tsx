import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Shield, AlertCircle } from "lucide-react";
import { BlurredCurrency } from "@/components/ui/BlurredValue";
import { LearnMoreLink } from "@/components/ui/LearnMoreLink";

interface RiskMetricsCardProps {
  title: string;
  value: number;
  maxValue: number;
  status: "safe" | "warning" | "danger";
  description: string;
  unit?: string;
  learnMoreHref?: string;
}

export function RiskMetricsCard({ title, value, maxValue, status, description, unit = '', learnMoreHref }: RiskMetricsCardProps) {
  const percentage = (value / maxValue) * 100;
  
  const getStatusColor = () => {
    switch (status) {
      case "safe": return "text-state-success";
      case "warning": return "text-state-warning";
      case "danger": return "text-state-error";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "safe": return <Shield className="h-5 w-5 text-state-success" />;
      case "warning": return <AlertCircle className="h-5 w-5 text-state-warning" />;
      case "danger": return <AlertTriangle className="h-5 w-5 text-state-error" />;
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case "safe": return "bg-state-success/10";
      case "warning": return "bg-state-warning/10";
      case "danger": return "bg-state-error/10";
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case "safe": return "border-l-state-success";
      case "warning": return "border-l-state-warning";
      case "danger": return "border-l-state-error";
    }
  };

  return (
    <Card className={`p-4 border-l-4 ${getBorderColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-1">{title}</h3>
          <div className={`text-3xl font-bold ${getStatusColor()}`}>
            <BlurredCurrency amount={value} className="inline" />{unit}
          </div>
        </div>
        {getStatusIcon()}
      </div>
      
      <Progress 
        value={Math.min(percentage, 100)} 
        className="h-2 mb-2"
      />
      
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-muted-foreground">
          Limit: <BlurredCurrency amount={maxValue} className="inline" />{unit}
        </span>
        <Badge variant="outline" className={getStatusBg()}>
          {percentage.toFixed(0)}%
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{description}</p>
        {learnMoreHref && <LearnMoreLink href={learnMoreHref} />}
      </div>
    </Card>
  );
}
