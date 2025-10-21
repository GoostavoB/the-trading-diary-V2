import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PlanEditorProps {
  plan?: any;
  onSave: () => void;
  onCancel: () => void;
}

const availableMarkets = ["Crypto", "Forex", "Stocks", "Futures", "Options"];
const availableTimeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

export function PlanEditor({ plan, onSave, onCancel }: PlanEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    markets: [] as string[],
    timeframes: [] as string[],
    entry_rules: "",
    exit_rules: "",
    risk_management: "",
    position_sizing: "",
    trading_schedule: "",
    review_process: "",
    is_active: false,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        markets: plan.markets || [],
        timeframes: plan.timeframes || [],
        entry_rules: plan.entry_rules || "",
        exit_rules: plan.exit_rules || "",
        risk_management: plan.risk_management || "",
        position_sizing: plan.position_sizing || "",
        trading_schedule: plan.trading_schedule || "",
        review_process: plan.review_process || "",
        is_active: plan.is_active || false,
      });
    }
  }, [plan]);

  const toggleMarket = (market: string) => {
    setFormData(prev => ({
      ...prev,
      markets: prev.markets.includes(market)
        ? prev.markets.filter(m => m !== market)
        : [...prev.markets, market]
    }));
  };

  const toggleTimeframe = (tf: string) => {
    setFormData(prev => ({
      ...prev,
      timeframes: prev.timeframes.includes(tf)
        ? prev.timeframes.filter(t => t !== tf)
        : [...prev.timeframes, tf]
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a plan name",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const planData = {
        user_id: user?.id,
        ...formData,
      };

      if (plan?.id) {
        const { error } = await supabase
          .from('trading_plans')
          .update(planData)
          .eq('id', plan.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trading_plans')
          .insert(planData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: plan ? "Plan updated successfully" : "Plan created successfully",
      });

      onSave();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        title: "Error",
        description: "Failed to save trading plan",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{plan ? "Edit" : "Create"} Trading Plan</CardTitle>
            <CardDescription>Document your strategy, rules, and risk management</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4">
            <div className="space-y-2">
              <Label>Plan Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Scalping Strategy, Swing Trading Plan"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief overview of your trading approach..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Markets</Label>
              <div className="flex flex-wrap gap-2">
                {availableMarkets.map((market) => (
                  <Badge
                    key={market}
                    variant={formData.markets.includes(market) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleMarket(market)}
                  >
                    {market}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Timeframes</Label>
              <div className="flex flex-wrap gap-2">
                {availableTimeframes.map((tf) => (
                  <Badge
                    key={tf}
                    variant={formData.timeframes.includes(tf) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTimeframe(tf)}
                  >
                    {tf}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="space-y-2">
              <Label>Entry Rules</Label>
              <Textarea
                value={formData.entry_rules}
                onChange={(e) => setFormData({ ...formData, entry_rules: e.target.value })}
                placeholder="When do you enter a trade? List specific conditions, indicators, patterns..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Exit Rules</Label>
              <Textarea
                value={formData.exit_rules}
                onChange={(e) => setFormData({ ...formData, exit_rules: e.target.value })}
                placeholder="When do you exit? Profit targets, stop losses, trailing stops..."
                rows={6}
              />
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="space-y-2">
              <Label>Risk Management Rules</Label>
              <Textarea
                value={formData.risk_management}
                onChange={(e) => setFormData({ ...formData, risk_management: e.target.value })}
                placeholder="Max risk per trade, daily loss limits, drawdown rules..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Position Sizing Strategy</Label>
              <Textarea
                value={formData.position_sizing}
                onChange={(e) => setFormData({ ...formData, position_sizing: e.target.value })}
                placeholder="How do you calculate position sizes? Fixed percentage, Kelly Criterion..."
                rows={6}
              />
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-2">
              <Label>Trading Schedule</Label>
              <Textarea
                value={formData.trading_schedule}
                onChange={(e) => setFormData({ ...formData, trading_schedule: e.target.value })}
                placeholder="When do you trade? Days, hours, market sessions..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Review Process</Label>
              <Textarea
                value={formData.review_process}
                onChange={(e) => setFormData({ ...formData, review_process: e.target.value })}
                placeholder="How often do you review? What metrics do you check? When do you adjust the plan..."
                rows={6}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Plan"}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
