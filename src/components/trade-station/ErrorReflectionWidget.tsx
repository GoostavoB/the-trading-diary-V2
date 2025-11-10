import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Archive, Trash2, Plus } from 'lucide-react';
import { useErrorReflection } from '@/hooks/useErrorReflection';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const ErrorReflectionWidget = () => {
  const {
    errors,
    settings,
    loading,
    addError,
    archiveError,
    deleteError,
    updateSettings,
    pauseReminder,
  } = useErrorReflection();
  
  const [newError, setNewError] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddError = async () => {
    if (!newError.trim()) return;
    await addError(newError, 7);
    setNewError('');
    setShowAddDialog(false);
  };

  const visibleErrors = errors.slice(0, 3);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold">My Errors</h3>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Trading Error</DialogTitle>
              <DialogDescription>
                Reflecting daily may improve your performance by about 23 percent.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                placeholder="Describe what went wrong..."
                value={newError}
                onChange={(e) => setNewError(e.target.value)}
                rows={4}
                autoFocus
              />
              <Button onClick={handleAddError} className="w-full">
                Log Error
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : visibleErrors.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No active errors. Stay disciplined!
        </div>
      ) : (
        <div className="space-y-2">
          {visibleErrors.map((error) => (
            <div key={error.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded">
              <div className="flex-1 text-sm">{error.error_text}</div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => archiveError(error.id)}
                >
                  <Archive className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => deleteError(error.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.length > 3 && (
        <Button variant="link" size="sm" className="mt-2 w-full">
          View all {errors.length} errors
        </Button>
      )}

      <div className="mt-4 pt-4 border-t space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="daily-reminder" className="text-sm">
            Show daily reminder
          </Label>
          <Switch
            id="daily-reminder"
            checked={settings.error_daily_reminder}
            onCheckedChange={(checked) =>
              updateSettings({ error_daily_reminder: checked })
            }
          />
        </div>

        {settings.error_daily_reminder && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => pauseReminder(7)}
          >
            Pause for 7 days
          </Button>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="pnl-prompt" className="text-sm">
            Suggest logging on negative P&L
          </Label>
          <Switch
            id="pnl-prompt"
            checked={settings.error_pnl_prompt_enabled}
            onCheckedChange={(checked) =>
              updateSettings({ error_pnl_prompt_enabled: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="clean-sheet" className="text-sm">
            Show clean sheet message
          </Label>
          <Switch
            id="clean-sheet"
            checked={settings.error_clean_sheet}
            onCheckedChange={(checked) =>
              updateSettings({ error_clean_sheet: checked })
            }
          />
        </div>
      </div>
    </Card>
  );
};
