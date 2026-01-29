import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, Plus, Clock, Archive, Trash2, Edit, AlertTriangle, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useErrorReflection } from '@/hooks/useErrorReflection';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';
import { WidgetWrapper } from '@/components/widgets/WidgetWrapper';
import { WidgetProps } from '@/types/widget';

interface ErrorReflectionWidgetProps extends WidgetProps {
  fullPage?: boolean;
}

export const ErrorReflectionWidget = ({
  id,
  isEditMode,
  onRemove,
  onExpand,
  fullPage = false
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newErrorText, setNewErrorText] = useState('');
  const [editingError, setEditingError] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const navigate = useNavigate();

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
  const handleAddError = async () => {
    if (!newErrorText.trim()) return;
    try {
      await addError(newErrorText.trim());
      setNewErrorText('');
      setShowAddDialog(false);
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
      <div className="space-y-3 h-full flex flex-col">
        {/* Recent Trade Error Tags - Compact */}
        {recentTradeErrors.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Recent from trades</Label>
            <div className="flex flex-wrap gap-1">
              {recentTradeErrors.slice(0, 4).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-accent px-2 py-0.5"
                  onClick={() => {
                    setNewErrorText(tag);
                    setShowAddDialog(true);
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : errors.length === 0 ? (
          <div className="text-center py-4 flex-1 flex flex-col items-center justify-center">
            <div className="rounded-full bg-muted w-10 h-10 mx-auto mb-2 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No Active Errors</h3>
            <p className="text-xs text-muted-foreground mb-3">Track mistakes to improve.</p>
            <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" />
              Add First Error
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {displayErrors.map(error => (
                <div key={error.id} className="group rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="p-2.5">
                    <p className="text-xs leading-relaxed mb-2 line-clamp-2">{error.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {Math.ceil((new Date(error.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d left
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => extendError(error.id)}>
                              <Clock className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>+7 days</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => {
                              setEditingError(error.id);
                              setEditText(error.text);
                            }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => archiveError(error.id)}>
                              <Archive className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Archive</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => deleteError(error.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 h-8 text-xs"
                onClick={() => navigate('/error-analytics')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Analytics
              </Button>
              <Button size="sm" className="flex-1 gap-1.5 h-8 text-xs" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add Error
              </Button>
            </div>
          </>
        )}
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