import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PlanEditorProps {
  plan?: any;
  onSave: () => void;
  onCancel: () => void;
}

const availableCurrencyTypes = ["BTC", "ETH", "Top 10", "Mid Cap", "Small Caps", "Meme Coins"];
const availableTimeframes = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

export function PlanEditor({ plan, onSave, onCancel }: PlanEditorProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currency_types: [] as string[],
    timeframes: [] as string[],
    trade_setups: "",
    entry_rules: "",
    exit_rules: "",
    risk_management: "",
    position_sizing: "",
    trading_schedule: "",
    review_process: "",
    checklist: "",
    is_active: false,
  });

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || "",
        description: plan.description || "",
        currency_types: plan.currency_types || plan.markets || [],
        timeframes: plan.timeframes || [],
        trade_setups: plan.trade_setups || "",
        entry_rules: plan.entry_rules || "",
        exit_rules: plan.exit_rules || "",
        risk_management: plan.risk_management || "",
        position_sizing: plan.position_sizing || "",
        trading_schedule: plan.trading_schedule || "",
        review_process: plan.review_process || "",
        checklist: plan.checklist || "",
        is_active: plan.is_active || false,
      });
    }
  }, [plan]);

  const toggleCurrencyType = (currencyType: string) => {
    setFormData(prev => ({
      ...prev,
      currency_types: prev.currency_types.includes(currencyType)
        ? prev.currency_types.filter(c => c !== currencyType)
        : [...prev.currency_types, currencyType]
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
      toast.error("Required field", {
        description: "Please enter a title for your plan"
      });
      return;
    }

    if (!user) {
      toast.error("Not authenticated", {
        description: "Please sign in to save your plan"
      });
      return;
    }

    setIsSaving(true);
    const startTime = performance.now();

    try {
      console.info('[PlanEditor] Saving plan', { 
        userId: user.id, 
        isUpdate: !!plan?.id,
        formData 
      });

      if (plan?.id) {
        const { data, error } = await supabase
          .from('trading_plans')
          .update(formData)
          .eq('id', plan.id)
          .select('*')
          .single();
        
        if (error) throw error;
        
        const elapsed = Math.round(performance.now() - startTime);
        console.info('[PlanEditor] Update success', { id: data.id, ms: elapsed });
        toast.success("Plan updated successfully");
      } else {
        const { data, error } = await supabase
          .from('trading_plans')
          .insert({ ...formData, user_id: user.id })
          .select('*')
          .single();
        
        if (error) throw error;
        
        const elapsed = Math.round(performance.now() - startTime);
        console.info('[PlanEditor] Insert success', { id: data.id, ms: elapsed });
        toast.success("Plan created successfully");
      }
      
      queryClient.invalidateQueries({ queryKey: ['trading-plans', user.id] });
      queryClient.invalidateQueries({ queryKey: ['active-trading-plan', user.id] });
      onSave();
    } catch (error: any) {
      console.error('[PlanEditor] Save failed:', error);
      toast.error("Failed to save plan", {
        description: error.message || "Please try again."
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="setups">Setups</TabsTrigger>
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
              <Label>Currency Types</Label>
              <p className="text-sm text-muted-foreground">Select the types of cryptocurrencies you trade</p>
              <div className="flex flex-wrap gap-2">
                {availableCurrencyTypes.map((currencyType) => (
                  <Badge
                    key={currencyType}
                    variant={formData.currency_types.includes(currencyType) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCurrencyType(currencyType)}
                  >
                    {currencyType}
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

          <TabsContent value="setups" className="space-y-4">
            <div className="space-y-2">
              <Label>Trade Setups</Label>
              <p className="text-sm text-muted-foreground">
                Document your specific trade setups - the patterns and conditions you look for
              </p>
              <Textarea
                value={formData.trade_setups}
                onChange={(e) => setFormData({ ...formData, trade_setups: e.target.value })}
                placeholder="Example:&#10;• Breakout Setup: Price breaks above resistance with volume confirmation&#10;• Reversal Setup: Double bottom pattern with RSI divergence&#10;• Trend Following: Moving average crossover with MACD confirmation"
                rows={10}
              />
            </div>

            <div className="space-y-2">
              <Label>Pre-Trade Checklist</Label>
              <p className="text-sm text-muted-foreground">
                List of things to check before entering a trade
              </p>
              <Textarea
                value={formData.checklist}
                onChange={(e) => setFormData({ ...formData, checklist: e.target.value })}
                placeholder="Example:&#10;☐ Setup is confirmed&#10;☐ Risk/reward ratio is at least 1:2&#10;☐ Stop loss is defined&#10;☐ Position size calculated&#10;☐ No conflicting signals&#10;☐ Market conditions are favorable"
                rows={8}
              />
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
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !user}
            type="button" 
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Plan"}
          </Button>
          <Button 
            variant="outline" 
            onClick={onCancel}
            type="button"
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
