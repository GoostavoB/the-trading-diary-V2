import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Edit, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

interface PlanOverviewProps {
  onCreatePlan: () => void;
  onEditPlan: (plan: any) => void;
}

export function PlanOverview({ onCreatePlan, onEditPlan }: PlanOverviewProps) {
  const { user } = useAuth();

  const { data: plans, refetch } = useQuery({
    queryKey: ['trading-plans', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trading_plans')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const deletePlan = async (id: string) => {
    const { error } = await supabase
      .from('trading_plans')
      .delete()
      .eq('id', id);

    if (!error) {
      refetch();
    }
  };

  const toggleActive = async (plan: any) => {
    const { error } = await supabase
      .from('trading_plans')
      .update({ is_active: !plan.is_active })
      .eq('id', plan.id);

    if (!error) {
      refetch();
    }
  };

  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardContent className="pt-16 pb-16">
          <div className="text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Trading Plans Yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first trading plan to document your strategy and rules
            </p>
            <Button onClick={onCreatePlan}>
              <Plus className="h-4 w-4 mr-2" />
              Create Trading Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Trading Plans</h2>
        <Button onClick={onCreatePlan}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map((plan: any) => (
          <Card key={plan.id} className={plan.is_active ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.is_active && (
                      <Badge className="bg-green-500">Active</Badge>
                    )}
                  </div>
                  <CardDescription>{plan.description || "No description"}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deletePlan(plan.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Markets</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.markets?.slice(0, 3).map((market: string) => (
                      <Badge key={market} variant="outline">{market}</Badge>
                    ))}
                    {plan.markets?.length > 3 && (
                      <Badge variant="outline">+{plan.markets.length - 3}</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Timeframes</p>
                  <div className="flex flex-wrap gap-1">
                    {plan.timeframes?.slice(0, 2).map((tf: string) => (
                      <Badge key={tf} variant="outline">{tf}</Badge>
                    ))}
                    {plan.timeframes?.length > 2 && (
                      <Badge variant="outline">+{plan.timeframes.length - 2}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                {plan.entry_rules ? (
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Entry Rules</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>No Entry Rules</span>
                  </div>
                )}
                {plan.exit_rules ? (
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Exit Rules</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>No Exit Rules</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Created {format(new Date(plan.created_at), "MMM d, yyyy")}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEditPlan(plan)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant={plan.is_active ? "secondary" : "default"}
                  size="sm"
                  onClick={() => toggleActive(plan)}
                >
                  {plan.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
