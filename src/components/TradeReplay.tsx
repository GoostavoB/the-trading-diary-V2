import { PremiumCard } from '@/components/ui/PremiumCard';
import { Play, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TradeReplayProps {
    trades?: any[];
}

export const TradeReplay = ({ trades = [] }: TradeReplayProps) => {
    return (
        <PremiumCard className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Trade Replay</h3>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                        <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                        <Play className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                        <SkipForward className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="text-center py-12 text-muted-foreground">
                <p>Trade replay visualization coming soon</p>
                <p className="text-sm mt-2">Review your trades step-by-step</p>
            </div>
        </PremiumCard>
    );
};
