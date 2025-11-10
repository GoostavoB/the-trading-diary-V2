import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle, Rocket, XCircle } from 'lucide-react';
import { usePreFlight } from '@/hooks/usePreFlight';

export const PreFlightWidget = () => {
  const {
    checks,
    settings,
    session,
    lsrValue,
    spxTrend,
    setLsrValue,
    setSpxTrend,
    toggleCheck,
    isComplete,
    canStart,
    completePreFlight,
    bypassPreFlight,
    updateSettings,
    getLsrBias,
  } = usePreFlight();

  const isSessionActive = session?.preflight_completed || session?.preflight_bypassed;
  const lsrBias = lsrValue ? getLsrBias(lsrValue) : null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Pre-Flight Check</h3>
        </div>
        {isSessionActive && (
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Ready</span>
          </div>
        )}
      </div>

      {session?.preflight_bypassed && (
        <div className="mb-4 p-2 bg-orange-500/10 border border-orange-500/20 rounded text-sm text-orange-600">
          Pre-flight bypassed for today
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="spx-check"
            checked={checks.spx}
            onCheckedChange={() => toggleCheck('spx')}
            disabled={isSessionActive}
          />
          <Label htmlFor="spx-check" className="flex items-center gap-2 cursor-pointer flex-1">
            <span>SPX Trend</span>
          </Label>
          <Input
            type="text"
            placeholder="Up/Down/Sideways"
            value={spxTrend}
            onChange={(e) => setSpxTrend(e.target.value)}
            className="w-32 h-8"
            disabled={isSessionActive}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="lsr-check"
            checked={checks.lsr}
            onCheckedChange={() => toggleCheck('lsr')}
            disabled={isSessionActive}
          />
          <Label htmlFor="lsr-check" className="flex items-center gap-2 cursor-pointer flex-1">
            <span>LSR</span>
          </Label>
          <Input
            type="number"
            step="0.1"
            placeholder="0.0"
            value={lsrValue || ''}
            onChange={(e) => setLsrValue(parseFloat(e.target.value) || null)}
            className="w-32 h-8"
            disabled={isSessionActive}
          />
        </div>

        {lsrBias && (
          <div className={`text-xs pl-8 ${lsrBias.color}`}>
            {lsrBias.text}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="errors-check"
            checked={checks.errors}
            onCheckedChange={() => toggleCheck('errors')}
            disabled={isSessionActive}
          />
          <Label htmlFor="errors-check" className="cursor-pointer">
            Errors read
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="calendar-check"
            checked={checks.calendar}
            onCheckedChange={() => toggleCheck('calendar')}
            disabled={isSessionActive}
          />
          <Label htmlFor="calendar-check" className="flex items-center gap-2 cursor-pointer flex-1">
            <span>Economic calendar</span>
          </Label>
          {settings.preflight_calendar_url && (
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => window.open(settings.preflight_calendar_url, '_blank')}
            >
              View
            </Button>
          )}
        </div>

        {!settings.preflight_calendar_url && (
          <Input
            type="url"
            placeholder="Calendar URL (optional)"
            className="ml-8 h-8 text-sm"
            onBlur={(e) => {
              if (e.target.value) {
                updateSettings({ preflight_calendar_url: e.target.value });
              }
            }}
            disabled={isSessionActive}
          />
        )}
      </div>

      {!isSessionActive && (
        <div className="space-y-2">
          <Button
            onClick={completePreFlight}
            disabled={!canStart()}
            className="w-full"
          >
            {isComplete() ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Start Session
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Complete Checks
              </>
            )}
          </Button>

          <Button
            onClick={bypassPreFlight}
            variant="outline"
            className="w-full"
          >
            Ignore Today
          </Button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label htmlFor="require-checks" className="text-sm">
            Require 4 checks to start trading
          </Label>
          <Switch
            id="require-checks"
            checked={settings.preflight_required}
            onCheckedChange={(checked) =>
              updateSettings({ preflight_required: checked })
            }
          />
        </div>
      </div>
    </Card>
  );
};
