import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Circle, ExternalLink, Calendar } from 'lucide-react';
import { useState } from 'react';
import { usePreFlight } from '@/hooks/usePreFlight';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useToast } from '@/hooks/use-toast';

export const PreFlightWidget = () => {
  const { checks, updateCheck, allChecksComplete, startSession, bypassToday, sessionStarted, bypassedToday } = usePreFlight();
  const { settings, updateSetting } = useUserSettings();
  const { toast } = useToast();

  const handleStartSession = async () => {
    try {
      await startSession();
      toast({ title: 'Session started', description: 'Pre-flight checks completed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to start session', variant: 'destructive' });
    }
  };

  const handleBypass = async () => {
    try {
      await bypassToday();
      toast({ title: 'Pre-flight bypassed', description: 'You can trade without checks today.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to bypass', variant: 'destructive' });
    }
  };

  const canStart = !settings.preflight_required || allChecksComplete();

  if (sessionStarted && !bypassedToday) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pre-flight Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <p className="text-sm text-muted-foreground">Session active. Good trading!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bypassedToday) {
    return (
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle>Pre-flight Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-950/20">
            <p className="text-sm text-amber-600">⚠️ Pre-flight ignored today</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pre-flight Checklist</CardTitle>
          <Switch
            checked={settings.preflight_required}
            onCheckedChange={(checked) => updateSetting('preflight_required', checked)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SPX Check */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={checks.spxChecked}
            onCheckedChange={(checked) => updateCheck('spxChecked', checked)}
          />
          <div className="flex-1 space-y-2">
            <Label>SPX checked</Label>
            {checks.spxChecked && (
              <Input
                placeholder="Trend note (e.g., Up +1.2%)"
                value={checks.spxTrend || ''}
                onChange={(e) => updateCheck('spxTrend', e.target.value)}
              />
            )}
          </div>
        </div>

        {/* LSR Review */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={checks.lsrReviewed}
            onCheckedChange={(checked) => updateCheck('lsrReviewed', checked)}
          />
          <div className="flex-1 space-y-2">
            <Label>LSR reviewed</Label>
            {checks.lsrReviewed && (
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder="LSR value"
                  value={checks.lsrValue || ''}
                  onChange={(e) => updateCheck('lsrValue', parseFloat(e.target.value))}
                  step="0.1"
                />
                {checks.lsrValue && (
                  <p className="text-xs text-muted-foreground">
                    {checks.lsrValue > 2 && '⚠️ Avoid long positions'}
                    {checks.lsrValue < 1 && '⚠️ Avoid short positions'}
                    {checks.lsrValue >= 1 && checks.lsrValue <= 2 && '✓ Balanced'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Errors Reviewed */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={checks.errorsReviewed}
            onCheckedChange={(checked) => updateCheck('errorsReviewed', checked)}
          />
          <div className="flex-1">
            <Label>Active errors reviewed</Label>
          </div>
        </div>

        {/* Calendar Check */}
        <div className="flex items-start gap-3">
          <Checkbox
            checked={checks.calendarChecked}
            onCheckedChange={(checked) => updateCheck('calendarChecked', checked)}
          />
          <div className="flex-1 space-y-2">
            <Label>Economic calendar checked</Label>
            {checks.calendarChecked && (
              <div className="space-y-2">
                <Input
                  placeholder="Calendar URL"
                  value={settings.preflight_calendar_url || ''}
                  onChange={(e) => updateSetting('preflight_calendar_url', e.target.value)}
                />
                {settings.preflight_calendar_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={settings.preflight_calendar_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Open
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleStartSession}
            disabled={!canStart}
            className="flex-1"
          >
            Start session
          </Button>
          <Button
            variant="outline"
            onClick={handleBypass}
            className="flex-1"
          >
            Ignore today
          </Button>
        </div>

        {settings.preflight_required && !allChecksComplete() && (
          <p className="text-xs text-muted-foreground text-center">
            Complete all checks to start trading
          </p>
        )}
      </CardContent>
    </Card>
  );
};
