import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle, Plus, MoreHorizontal, Clock, Archive, Trash2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useErrorReflection } from '@/hooks/useErrorReflection';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';

export const ErrorReflectionWidget = () => {
  const { errors, loading, dailyReminderShown, todaysPnL, addError, extendError, archiveError, deleteError, markDailyReminderShown, checkCleanSheet } = useErrorReflection();
  const { settings, updateSetting } = useUserSettings();
  const { toast } = useToast();

  const [showDailyReminder, setShowDailyReminder] = useState(false);
  const [showPnLPrompt, setShowPnLPrompt] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newErrorText, setNewErrorText] = useState('');
  const [editingError, setEditingError] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Check for daily reminder on mount
  useEffect(() => {
    if (!loading && !dailyReminderShown && settings.error_daily_reminder && errors.length > 0) {
      setShowDailyReminder(true);
    }
  }, [loading, dailyReminderShown, settings.error_daily_reminder, errors.length]);

  // Check for clean sheet
  useEffect(() => {
    if (settings.error_clean_sheet_enabled) {
      checkCleanSheet().then((isClean) => {
        if (isClean) {
          toast({
            title: '✅ Clean sheet',
            description: 'Stay disciplined today.',
          });
        }
      });
    }
  }, [settings.error_clean_sheet_enabled]);

  // Check for negative P&L prompt
  useEffect(() => {
    if (settings.error_pnl_prompt_enabled) {
      const threshold = settings.error_pnl_threshold_type === 'percent'
        ? (todaysPnL / 100) * settings.error_pnl_threshold_value
        : settings.error_pnl_threshold_value;

      if (todaysPnL < -Math.abs(threshold)) {
        setShowPnLPrompt(true);
      }
    }
  }, [todaysPnL, settings.error_pnl_prompt_enabled, settings.error_pnl_threshold_value, settings.error_pnl_threshold_type]);

  const handleAddError = async () => {
    if (!newErrorText.trim()) return;
    try {
      await addError(newErrorText.trim());
      setNewErrorText('');
      setShowAddDialog(false);
      setShowPnLPrompt(false);
      toast({ title: 'Error logged', description: 'Your reflection has been saved.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add error', variant: 'destructive' });
    }
  };

  const handleDismissDailyReminder = () => {
    markDailyReminderShown();
    setShowDailyReminder(false);
  };

  const displayErrors = errors.slice(0, 3);
  const randomErrors = displayErrors.sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Error Reflection</CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.error_daily_reminder}
                onCheckedChange={(checked) => updateSetting('error_daily_reminder', checked)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : errors.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-4">No active errors. Add one to start tracking.</p>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add error
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayErrors.map((error) => (
                  <div key={error.id} className="rounded-md border p-3 space-y-2">
                    <p className="text-sm line-clamp-2">{error.text}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => extendError(error.id)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        +7d
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => archiveError(error.id)}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Archive
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteError(error.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingError(error.id);
                          setEditText(error.text);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View all
                </Button>
                <Button size="sm" className="flex-1" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add error
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Daily Reminder Modal */}
      <Dialog open={showDailyReminder} onOpenChange={setShowDailyReminder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daily Error Review</DialogTitle>
            <DialogDescription>
              Reflecting daily may improve your performance by about 23 percent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="font-semibold text-sm">Active Errors:</p>
            <ul className="list-disc list-inside space-y-1">
              {randomErrors.map((error) => (
                <li key={error.id} className="text-sm">{error.text}</li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              updateSetting('error_reminder_paused_until', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
              handleDismissDailyReminder();
            }}>
              Pause 7 days
            </Button>
            <Button onClick={handleDismissDailyReminder}>Dismiss</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Negative P&L Prompt */}
      <Dialog open={showPnLPrompt} onOpenChange={setShowPnLPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Your Error?</DialogTitle>
            <DialogDescription>
              Your P&L is now ${todaysPnL.toFixed(2)}. Consider logging what went wrong:
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={newErrorText}
            onChange={(e) => setNewErrorText(e.target.value)}
            placeholder="What happened?"
            autoFocus
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPnLPrompt(false);
              setNewErrorText('');
            }}>
              Dismiss
            </Button>
            <Button onClick={handleAddError}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Error Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Error</DialogTitle>
          </DialogHeader>
          <Textarea
            value={newErrorText}
            onChange={(e) => setNewErrorText(e.target.value)}
            placeholder="Describe the mistake..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setNewErrorText('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddError}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
