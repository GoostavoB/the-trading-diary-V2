import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Mail, Clock, Trash2 } from "lucide-react";
import { format, addDays, addWeeks, addMonths } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ScheduledReports() {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newSchedule, setNewSchedule] = React.useState({
    name: "",
    frequency: "weekly",
    reportType: "monthly",
    format: "pdf",
    emailEnabled: false,
    emailAddress: "",
  });

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['scheduled-reports', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      let nextRun: Date;
      if (newSchedule.frequency === 'daily') {
        nextRun = addDays(new Date(), 1);
      } else if (newSchedule.frequency === 'weekly') {
        nextRun = addWeeks(new Date(), 1);
      } else {
        nextRun = addMonths(new Date(), 1);
      }

      const { error } = await supabase
        .from('scheduled_reports')
        .insert({
          user_id: user.id,
          schedule_name: newSchedule.name,
          frequency: newSchedule.frequency,
          report_type: newSchedule.reportType,
          report_format: newSchedule.format,
          report_config: {},
          email_enabled: newSchedule.emailEnabled,
          email_address: newSchedule.emailAddress || null,
          next_run_at: nextRun.toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Schedule created successfully');
      setShowAddForm(false);
      setNewSchedule({
        name: "",
        frequency: "weekly",
        reportType: "monthly",
        format: "pdf",
        emailEnabled: false,
        emailAddress: "",
      });
    },
    onError: (error) => {
      toast.error('Failed to create schedule');
      console.error(error);
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ is_enabled: enabled })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-reports'] });
      toast.success('Schedule deleted successfully');
    },
  });

  const toggleSchedule = (id: string, enabled: boolean) => {
    toggleScheduleMutation.mutate({ id, enabled });
  };

  const deleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      deleteScheduleMutation.mutate(id);
    }
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.name) {
      toast.error('Please enter a schedule name');
      return;
    }
    createScheduleMutation.mutate();
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "weekly":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "monthly":
        return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>Automate report generation and delivery</CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Create New Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Schedule Name</Label>
                <Input
                  value={newSchedule.name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  placeholder="e.g., Weekly Performance Report"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={newSchedule.frequency}
                    onValueChange={(value: any) => setNewSchedule({ ...newSchedule, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select
                    value={newSchedule.reportType}
                    onValueChange={(value: any) => setNewSchedule({ ...newSchedule, reportType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    value={newSchedule.format}
                    onValueChange={(value: any) => setNewSchedule({ ...newSchedule, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newSchedule.emailEnabled}
                  onCheckedChange={(checked) => setNewSchedule({ ...newSchedule, emailEnabled: checked })}
                />
                <Label>Email report when generated</Label>
              </div>

              {newSchedule.emailEnabled && (
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={newSchedule.emailAddress}
                    onChange={(e) => setNewSchedule({ ...newSchedule, emailAddress: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => setShowAddForm(false)} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleCreateSchedule} disabled={createScheduleMutation.isPending}>
                  {createScheduleMutation.isPending ? 'Creating...' : 'Create Schedule'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading schedules...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules && schedules.length > 0 ? schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="p-2 bg-primary/10 rounded-lg mt-1">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{schedule.schedule_name}</h4>
                    <Badge className={getFrequencyColor(schedule.frequency)}>
                      {schedule.frequency}
                    </Badge>
                    <Badge variant="outline">
                      {schedule.report_format.toUpperCase()}
                    </Badge>
                    {schedule.email_enabled && (
                      <Badge variant="outline" className="gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Next run: {schedule.next_run_at ? format(new Date(schedule.next_run_at), "MMM d, yyyy 'at' h:mm a") : 'Not scheduled'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={schedule.is_enabled}
                  onCheckedChange={() => toggleSchedule(schedule.id, !schedule.is_enabled)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteSchedule(schedule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )) : (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
              <p className="text-sm text-muted-foreground">
                Create your first automated report schedule
              </p>
            </div>
          )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
