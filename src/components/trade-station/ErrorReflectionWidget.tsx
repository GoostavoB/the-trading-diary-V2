import { CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Plus, Clock, Archive, Trash2, Edit, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useErrorReflection } from '@/hooks/useErrorReflection';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';
import { WidgetWrapper } from '@/components/widgets/WidgetWrapper';
import { WidgetProps } from '@/types/widget';

interface ErrorReflectionWidgetProps extends WidgetProps {}

export const ErrorReflectionWidget = ({ 
  id, 
  isEditMode, 
  onRemove, 
  onExpand 
}: ErrorReflectionWidgetProps) => {
  const {
    errors,
    loading,
    dailyReminderShown,
    todaysPnL,
    recentTradeErrors,
    addError,
    extendError,
    archiveError,
    deleteError,
    markDailyReminderShown,
    checkCleanSheet
  } = useErrorReflection();
  const {
    settings,
    updateSetting
  } = useUserSettings();
  const {
    toast
  } = useToast();
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
      checkCleanSheet().then(isClean => {
        if (isClean) {
          toast({
            title: '✅ Clean sheet',
            description: 'Stay disciplined today.'
          });
        }
      });
    }
  }, [settings.error_clean_sheet_enabled]);

  // Check for negative P&L prompt
  useEffect(() => {
    if (settings.error_pnl_prompt_enabled) {
      const threshold = settings.error_pnl_threshold_type === 'percent' ? todaysPnL / 100 * settings.error_pnl_threshold_value : settings.error_pnl_threshold_value;
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
      toast({
        title: 'Error logged',
        description: 'Your reflection has been saved.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add error',
        variant: 'destructive'
      });
    }
  };
  const handleDismissDailyReminder = () => {
    markDailyReminderShown();
    setShowDailyReminder(false);
  };
  const displayErrors = errors.slice(0, 3);
  const randomErrors = displayErrors.sort(() => Math.random() - 0.5).slice(0, 3);
  return <TooltipProvider>
      <WidgetWrapper
        id={id}
        title="Error Reflection"
        isEditMode={isEditMode}
        onRemove={onRemove}
        onExpand={onExpand}
        headerActions={
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Label htmlFor="daily-reminder" className="text-xs text-muted-foreground cursor-pointer">
                  Daily
                </Label>
                <Switch id="daily-reminder" checked={settings.error_daily_reminder} onCheckedChange={checked => updateSetting('error_daily_reminder', checked)} />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show daily reminder with active errors</p>
            </TooltipContent>
          </Tooltip>
        }
      >
        <div className="space-y-4">
          {/* Recent Trade Error Tags */}
          {recentTradeErrors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Recent from trades (last 7 days)</Label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentTradeErrors.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setNewErrorText(tag);
                      setShowAddDialog(true);
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Click a tag to add it as a tracked error</p>
            </div>
          )}

          {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : errors.length === 0 ? <div className="text-center py-8 px-4">
              <div className="rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No Active Errors</h3>
              <p className="text-sm text-muted-foreground mb-4">Start tracking mistakes to improve your trading.</p>
              <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Error
              </Button>
            </div> : <>
              <div className="space-y-2">
                {displayErrors.map(error => <div key={error.id} className="group rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                    <div className="p-4">
                      <p className="text-sm leading-relaxed mb-3">{error.text}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Expires in {Math.ceil((new Date(error.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                        </span>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => extendError(error.id)}>
                                <Clock className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Extend 7 days</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => {
                          setEditingError(error.id);
                          setEditText(error.text);
                        }}>
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit error</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => archiveError(error.id)}>
                                <Archive className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Archive</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => deleteError(error.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View all ({errors.length})
                </Button>
                <Button size="sm" className="flex-1 gap-2" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Error
                </Button>
              </div>
            </>}
        </div>
      </WidgetWrapper>

      {/* Daily Reminder Modal */}
      <Dialog open={showDailyReminder} onOpenChange={setShowDailyReminder}>
        <DialogContent className="max-w-md">
          <div className="flex items-start gap-4 mb-6">
            <div className="rounded-full bg-amber-500/10 p-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <DialogHeader className="space-y-1.5 pb-0">
                <DialogTitle className="text-xl">Daily Error Review</DialogTitle>
                <DialogDescription className="text-base">
                  Take a moment to review your active errors
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
          
          <div className="space-y-3 my-6">
            <p className="text-sm font-medium text-muted-foreground">Active Errors:</p>
            <div className="space-y-2">
              {randomErrors.map(error => <div key={error.id} className="rounded-lg bg-accent/50 p-3 border border-border/50">
                  <p className="text-sm leading-relaxed">{error.text}</p>
                </div>)}
            </div>
          </div>

          <div className="rounded-md bg-muted/50 p-3 mb-6 border border-border/50">
            <p className="text-xs text-muted-foreground text-center font-semibold">DID YOU KNOW?</p>
            <p className="text-xs text-muted-foreground text-center">Daily reflection can improve your performance by about 23%</p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="flex-1" onClick={() => {
            updateSetting('error_reminder_paused_until', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
            handleDismissDailyReminder();
          }}>
              Pause 7 days
            </Button>
            <Button className="flex-1" onClick={handleDismissDailyReminder}>
              Dismiss
            </Button>
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
          <Textarea value={newErrorText} onChange={e => setNewErrorText(e.target.value)} placeholder="What happened?" autoFocus rows={4} />
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
          <Textarea value={newErrorText} onChange={e => setNewErrorText(e.target.value)} placeholder="Describe the mistake..." rows={4} />
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
    </TooltipProvider>;
};