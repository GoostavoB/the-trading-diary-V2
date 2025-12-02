import { memo, useState } from 'react';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { formatCurrency, formatPercent } from '@/utils/formatNumber';
import { TrendingUp, TrendingDown, Target, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface PerformanceMetricsWidgetProps {
    id: string;
    isEditMode?: boolean;
    onRemove?: () => void;
    currentROI: number;
    initialInvestment: number;
    currentBalance: number;
    winRate: number;
    wins: number;
    losses: number;
    totalTrades: number;
    avgPnLPerDay: number;
    onInitialInvestmentUpdate?: (newValue: number) => void;
}

/**
 * Combined Performance Metrics Widget (ROI + Win Rate + Avg P&L)
 * Full width widget (6 columns), provides comprehensive performance overview
 */
export const PerformanceMetricsWidget = memo(({
    id,
    isEditMode,
    onRemove,
    currentROI,
    initialInvestment,
    currentBalance,
    winRate,
    wins,
    losses,
    totalTrades,
    avgPnLPerDay,
    onInitialInvestmentUpdate,
}: PerformanceMetricsWidgetProps) => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const isROIPositive = currentROI >= 0;
    const isPnLPositive = avgPnLPerDay >= 0;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [capitalValue, setCapitalValue] = useState(initialInvestment.toString());
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        const newValue = parseFloat(capitalValue);

        if (isNaN(newValue) || newValue < 0) {
            toast.error(t('errors.validationError'));
            return;
        }

        if (!user) {
            toast.error(t('errors.unauthorized'));
            return;
        }

        setIsSaving(true);
        try {
            const { error: settingsError } = await supabase
                .from('user_settings')
                .update({ initial_investment: newValue })
                .eq('user_id', user.id);

            if (settingsError) throw settingsError;

            const { error: deleteError } = await supabase
                .from('capital_log')
                .delete()
                .eq('user_id', user.id);

            if (deleteError) throw deleteError;

            const today = new Date().toISOString().split('T')[0];
            const { error: insertError } = await supabase
                .from('capital_log')
                .insert({
                    user_id: user.id,
                    log_date: today,
                    amount_added: newValue,
                    total_after: newValue,
                    notes: 'Initial capital set'
                });

            if (insertError) throw insertError;

            if (onInitialInvestmentUpdate) {
                onInitialInvestmentUpdate(newValue);
            }

            toast.success(t('success.updated'));
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Error updating initial investment:', error);
            toast.error(t('errors.generic'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-3 gap-4 p-4 h-full">
            {/* Column 1: Current ROI */}
            <div className="flex flex-col justify-center space-y-2 border-r border-border/50 pr-4">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Current ROI
                    </span>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                            >
                                <Edit2 className="h-3 w-3" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Initial Investment</DialogTitle>
                                <DialogDescription>
                                    Update your starting capital amount
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="capital">Initial Investment</Label>
                                    <Input
                                        id="capital"
                                        type="number"
                                        value={capitalValue}
                                        onChange={(e) => setCapitalValue(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className={`text-3xl font-bold tracking-tight ${isROIPositive ? 'text-profit' : 'text-loss'}`}>
                    <AnimatedCounter
                        value={currentROI}
                        prefix={isROIPositive ? '+' : ''}
                        suffix="%"
                        decimals={2}
                    />
                    {isROIPositive ? (
                        <TrendingUp className="inline-block ml-2 h-5 w-5" />
                    ) : (
                        <TrendingDown className="inline-block ml-2 h-5 w-5" />
                    )}
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                    <div>Initial: <BlurredCurrency amount={initialInvestment} className="inline" /></div>
                    <div>Current: <BlurredCurrency amount={currentBalance} className="inline font-medium" /></div>
                </div>
            </div>

            {/* Column 2: Win Rate */}
            <div className="flex flex-col justify-center space-y-2 border-r border-border/50 pr-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
                        <Target className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Win Rate
                    </span>
                </div>

                <div className="text-3xl font-bold gradient-text tracking-tight">
                    {formatPercent(winRate)}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
                        {wins}W
                    </span>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-neon-red/10 text-neon-red border border-neon-red/20">
                        {losses}L
                    </span>
                    <span className="text-xs text-muted-foreground">
                        / {totalTrades} trades
                    </span>
                </div>
            </div>

            {/* Column 3: Avg P&L per Day */}
            <div className="flex flex-col justify-center space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Avg P&L / Day
                </span>

                <div className={`text-3xl font-bold tracking-tight flex items-center gap-2 ${isPnLPositive ? 'text-profit' : 'text-loss'}`}>
                    {isPnLPositive ? '' : '-'}
                    <BlurredCurrency amount={Math.abs(avgPnLPerDay)} className="inline" />
                    {isPnLPositive ? (
                        <TrendingUp className="h-5 w-5" />
                    ) : (
                        <TrendingDown className="h-5 w-5" />
                    )}
                </div>

                <div className="text-xs text-muted-foreground">
                    Daily average performance
                </div>
            </div>
        </div>
    );
});

PerformanceMetricsWidget.displayName = 'PerformanceMetricsWidget';
