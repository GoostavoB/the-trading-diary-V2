import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface PerformanceAlert {
  id: string;
  alert_name: string;
  alert_type: string;
  threshold_value: number;
  comparison_operator: string;
  is_enabled: boolean;
  cooldown_minutes: number;
  last_triggered_at: string | null;
  created_at: string;
}

interface AlertHistory {
  id: string;
  alert_type: string;
  triggered_value: number;
  threshold_value: number;
  message: string;
  created_at: string;
  clicked: boolean;
}

const ALERT_TYPES = [
  { value: "win_rate", label: "Win Rate", icon: TrendingUp },
  { value: "roi", label: "ROI", icon: TrendingUp },
  { value: "daily_loss", label: "Daily Loss Limit", icon: AlertTriangle },
  { value: "drawdown", label: "Max Drawdown", icon: TrendingDown },
  { value: "profit_target", label: "Profit Target", icon: TrendingUp },
];

const PerformanceAlerts = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PerformanceAlert | null>(null);
  const [formData, setFormData] = useState({
    alert_name: "",
    alert_type: "win_rate",
    threshold_value: "0",
    comparison_operator: "below",
    cooldown_minutes: "60",
    is_enabled: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["performance-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PerformanceAlert[];
    },
  });

  const { data: alertHistory = [] } = useQuery({
    queryKey: ["alert-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as AlertHistory[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("performance_alerts").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-alerts"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Alert Created",
        description: "Performance alert has been created successfully.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("performance_alerts")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-alerts"] });
      setIsDialogOpen(false);
      setEditingAlert(null);
      resetForm();
      toast({
        title: "Alert Updated",
        description: "Performance alert has been updated successfully.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("performance_alerts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-alerts"] });
      toast({
        title: "Alert Deleted",
        description: "Performance alert has been deleted successfully.",
      });
    },
  });

  const toggleAlertMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("performance_alerts")
        .update({ is_enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-alerts"] });
    },
  });

  const resetForm = () => {
    setFormData({
      alert_name: "",
      alert_type: "win_rate",
      threshold_value: "0",
      comparison_operator: "below",
      cooldown_minutes: "60",
      is_enabled: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      threshold_value: parseFloat(formData.threshold_value),
      cooldown_minutes: parseInt(formData.cooldown_minutes),
    };

    if (editingAlert) {
      updateMutation.mutate({ id: editingAlert.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (alert: PerformanceAlert) => {
    setEditingAlert(alert);
    setFormData({
      alert_name: alert.alert_name,
      alert_type: alert.alert_type,
      threshold_value: alert.threshold_value.toString(),
      comparison_operator: alert.comparison_operator,
      cooldown_minutes: alert.cooldown_minutes.toString(),
      is_enabled: alert.is_enabled,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this alert?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id: string, currentState: boolean) => {
    toggleAlertMutation.mutate({ id, is_enabled: !currentState });
  };

  const getAlertTypeLabel = (type: string) => {
    const alertType = ALERT_TYPES.find(t => t.value === type);
    return alertType?.label || type;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Performance Alerts</h1>
            <p className="text-muted-foreground mt-2">
              Set up alerts for key performance metrics and risk thresholds
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => { setEditingAlert(null); resetForm(); }}>
                <Plus className="h-4 w-4" />
                Create Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingAlert ? "Edit Alert" : "Create New Alert"}</DialogTitle>
                  <DialogDescription>
                    {editingAlert ? "Update your performance alert" : "Set up a new performance alert"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="alert_name">Alert Name *</Label>
                    <Input
                      id="alert_name"
                      value={formData.alert_name}
                      onChange={(e) => setFormData({ ...formData, alert_name: e.target.value })}
                      placeholder="e.g., Low Win Rate Warning"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alert_type">Alert Type *</Label>
                    <Select value={formData.alert_type} onValueChange={(value) => setFormData({ ...formData, alert_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALERT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="comparison_operator">Condition</Label>
                      <Select value={formData.comparison_operator} onValueChange={(value) => setFormData({ ...formData, comparison_operator: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Above</SelectItem>
                          <SelectItem value="below">Below</SelectItem>
                          <SelectItem value="equals">Equals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="threshold_value">Threshold Value *</Label>
                      <Input
                        id="threshold_value"
                        type="number"
                        step="0.01"
                        value={formData.threshold_value}
                        onChange={(e) => setFormData({ ...formData, threshold_value: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cooldown_minutes">Cooldown (minutes)</Label>
                    <Input
                      id="cooldown_minutes"
                      type="number"
                      value={formData.cooldown_minutes}
                      onChange={(e) => setFormData({ ...formData, cooldown_minutes: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum time between alert notifications
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_enabled"
                      checked={formData.is_enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                    />
                    <Label htmlFor="is_enabled">Enable Alert</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingAlert ? "Update Alert" : "Create Alert"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="alerts">Active Alerts ({alerts.filter(a => a.is_enabled).length})</TabsTrigger>
            <TabsTrigger value="history">Alert History ({alertHistory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            <div className="grid gap-4">
              {alerts.map((alert) => {
                const alertType = ALERT_TYPES.find(t => t.value === alert.alert_type);
                const Icon = alertType?.icon || Bell;

                return (
                  <Card key={alert.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${alert.is_enabled ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`h-5 w-5 ${alert.is_enabled ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{alert.alert_name}</h3>
                            <Badge variant={alert.is_enabled ? "default" : "secondary"}>
                              {alert.is_enabled ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getAlertTypeLabel(alert.alert_type)} {alert.comparison_operator} {alert.threshold_value}
                            {alert.alert_type === "win_rate" || alert.alert_type === "roi" ? "%" : ""}
                          </p>
                          {alert.last_triggered_at && (
                            <p className="text-xs text-muted-foreground">
                              Last triggered: {format(new Date(alert.last_triggered_at), "MMM dd, yyyy h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alert.is_enabled}
                          onCheckedChange={() => handleToggle(alert.id, alert.is_enabled)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(alert)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(alert.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {alerts.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Performance Alerts</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first alert to monitor your trading performance
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Alert
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Alert History</CardTitle>
                <CardDescription>
                  Recent performance alerts that have been triggered
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Alert Type</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-right">Triggered Value</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertHistory.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>{format(new Date(history.created_at), "MMM dd, h:mm a")}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getAlertTypeLabel(history.alert_type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md">{history.message}</TableCell>
                        <TableCell className="text-right font-medium">
                          {history.triggered_value}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {history.threshold_value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PerformanceAlerts;
