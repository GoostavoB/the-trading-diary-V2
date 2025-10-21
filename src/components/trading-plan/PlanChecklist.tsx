import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Circle, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const defaultChecklist = [
  { id: "market_conditions", label: "Check market conditions", category: "Pre-Trade" },
  { id: "plan_review", label: "Review active trading plan", category: "Pre-Trade" },
  { id: "mental_state", label: "Assess mental/emotional state", category: "Pre-Trade" },
  { id: "risk_check", label: "Verify daily risk limits not exceeded", category: "Pre-Trade" },
  { id: "setup_identified", label: "Valid setup identified per plan", category: "Entry" },
  { id: "entry_criteria", label: "All entry criteria met", category: "Entry" },
  { id: "position_sized", label: "Position size calculated correctly", category: "Entry" },
  { id: "stop_set", label: "Stop loss set before entry", category: "Entry" },
  { id: "profit_target", label: "Profit target defined", category: "Entry" },
  { id: "monitor_trade", label: "Monitor trade per plan", category: "In-Trade" },
  { id: "trailing_stop", label: "Adjust trailing stop if applicable", category: "In-Trade" },
  { id: "exit_signal", label: "Exit signal appeared", category: "Exit" },
  { id: "log_trade", label: "Log trade with notes", category: "Post-Trade" },
  { id: "review_execution", label: "Review execution vs plan", category: "Post-Trade" },
];

export function PlanChecklist() {
  const { user } = useAuth();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const { data: activePlan } = useQuery({
    queryKey: ['active-trading-plan', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_plans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const resetChecklist = () => {
    setCheckedItems(new Set());
  };

  const categories = Array.from(new Set(defaultChecklist.map(item => item.category)));
  const completionRate = (checkedItems.size / defaultChecklist.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pre-Trade Checklist</CardTitle>
            <CardDescription>
              {activePlan ? (
                <>Following: <span className="font-semibold">{activePlan.name}</span></>
              ) : (
                "No active plan selected"
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={resetChecklist}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Completion</span>
            <span className="text-sm text-muted-foreground">
              {checkedItems.size} / {defaultChecklist.length}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryItems = defaultChecklist.filter(
                (item) => item.category === category
              );
              const categoryCompleted = categoryItems.filter((item) =>
                checkedItems.has(item.id)
              ).length;
              const isCategoryComplete = categoryCompleted === categoryItems.length;

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={isCategoryComplete ? "default" : "outline"}>
                      {category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {categoryCompleted}/{categoryItems.length}
                    </span>
                    {isCategoryComplete && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="space-y-2 pl-2">
                    {categoryItems.map((item) => {
                      const isChecked = checkedItems.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            id={item.id}
                            checked={isChecked}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <Label
                            htmlFor={item.id}
                            className={`flex-1 cursor-pointer ${
                              isChecked ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {item.label}
                          </Label>
                          {isChecked ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {completionRate === 100 && (
          <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">All checks complete!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              You're ready to trade according to your plan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
