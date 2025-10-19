import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Layers, Plus, Edit2, Trash2, TrendingUp, Target, DollarSign, BarChart3, Trophy } from 'lucide-react';
import type { Trade } from '@/types/trade';

interface SetupPerformance {
  name: string;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgPnl: number;
  bestTrade: number;
  worstTrade: number;
}

interface SetupManagerProps {
  trades: Trade[];
}

export const SetupManager = ({ trades }: SetupManagerProps) => {
  const { user } = useAuth();
  const [setups, setSetups] = useState<{ id: string; name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSetup, setEditingSetup] = useState<{ id: string; name: string } | null>(null);
  const [setupName, setSetupName] = useState('');
  const [setupPerformance, setSetupPerformance] = useState<SetupPerformance[]>([]);

  useEffect(() => {
    if (user) {
      fetchSetups();
    }
  }, [user]);

  useEffect(() => {
    if (setups.length > 0 && trades.length > 0) {
      calculateSetupPerformance();
    }
  }, [setups, trades]);

  const fetchSetups = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_setups')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching setups:', error);
      return;
    }

    setSetups(data || []);
  };

  const calculateSetupPerformance = () => {
    const performance: SetupPerformance[] = setups.map(setup => {
      const setupTrades = trades.filter(t => 
        t.setup?.toLowerCase() === setup.name.toLowerCase()
      );

      if (setupTrades.length === 0) {
        return {
          name: setup.name,
          totalTrades: 0,
          winRate: 0,
          totalPnl: 0,
          avgPnl: 0,
          bestTrade: 0,
          worstTrade: 0,
        };
      }

      const totalPnl = setupTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winningTrades = setupTrades.filter(t => (t.pnl || 0) > 0);
      const winRate = (winningTrades.length / setupTrades.length) * 100;
      const avgPnl = totalPnl / setupTrades.length;
      const bestTrade = Math.max(...setupTrades.map(t => t.pnl || 0));
      const worstTrade = Math.min(...setupTrades.map(t => t.pnl || 0));

      return {
        name: setup.name,
        totalTrades: setupTrades.length,
        winRate,
        totalPnl,
        avgPnl,
        bestTrade,
        worstTrade,
      };
    });

    // Sort by total P&L descending
    performance.sort((a, b) => b.totalPnl - a.totalPnl);
    setSetupPerformance(performance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !setupName.trim()) return;

    if (editingSetup) {
      const { error } = await supabase
        .from('user_setups')
        .update({ name: setupName.trim() })
        .eq('id', editingSetup.id);

      if (error) {
        toast.error('Failed to update setup');
        return;
      }
      toast.success('Setup updated');
    } else {
      const { error } = await supabase
        .from('user_setups')
        .insert({
          user_id: user.id,
          name: setupName.trim(),
        });

      if (error) {
        toast.error('Failed to create setup');
        return;
      }
      toast.success('Setup created');
    }

    setIsOpen(false);
    setEditingSetup(null);
    setSetupName('');
    fetchSetups();
  };

  const handleDelete = async (setupId: string) => {
    const { error } = await supabase
      .from('user_setups')
      .delete()
      .eq('id', setupId);

    if (error) {
      toast.error('Failed to delete setup');
      return;
    }

    toast.success('Setup deleted');
    fetchSetups();
  };

  const handleEdit = (setup: { id: string; name: string }) => {
    setEditingSetup(setup);
    setSetupName(setup.name);
    setIsOpen(true);
  };

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Trading Setups
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage and analyze your trading strategies
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Setup
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSetup ? 'Edit Setup' : 'Create New Setup'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="setup-name">Setup Name</Label>
                <Input
                  id="setup-name"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="e.g., Breakout, Support/Resistance, Trend Follow"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Give your setup a descriptive name to easily identify it when logging trades
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingSetup ? 'Update Setup' : 'Create Setup'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingSetup(null);
                    setSetupName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {setups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No trading setups yet</p>
          <p className="text-sm">
            Create setups to categorize and analyze your trading strategies
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Setup List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {setups.map((setup) => (
              <Card
                key={setup.id}
                className="p-3 bg-muted/20 border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-sm">
                    {setup.name}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(setup)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(setup.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Performance Analysis */}
          {setupPerformance.length > 0 && (
            <>
              <div className="border-t border-border pt-6 mt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Setup Performance Analysis
                </h4>
              </div>

              <div className="space-y-3">
                {setupPerformance.map((perf, idx) => (
                  <Card
                    key={perf.name}
                    className={`p-4 transition-all duration-300 ${
                      perf.totalPnl > 0
                        ? 'bg-neon-green/10 border-neon-green/30'
                        : perf.totalPnl < 0
                        ? 'bg-neon-red/10 border-neon-red/30'
                        : 'bg-muted/20 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {idx === 0 && perf.totalPnl > 0 && (
                          <Trophy className="h-5 w-5 text-primary" />
                        )}
                        <h5 className="font-semibold">{perf.name}</h5>
                        <Badge variant="outline" className="text-xs">
                          {perf.totalTrades} trades
                        </Badge>
                      </div>
                    </div>

                    {perf.totalTrades > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
                          <div className={`text-lg font-bold ${
                            perf.totalPnl > 0 ? 'text-neon-green' : 'text-neon-red'
                          }`}>
                            {perf.totalPnl > 0 ? '+' : ''}${perf.totalPnl.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                          <div className={`text-lg font-bold ${
                            perf.winRate >= 70 ? 'text-neon-green' : ''
                          }`}>
                            {perf.winRate.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Avg P&L</div>
                          <div className={`text-lg font-bold ${
                            perf.avgPnl > 0 ? 'text-neon-green' : 'text-neon-red'
                          }`}>
                            {perf.avgPnl > 0 ? '+' : ''}${perf.avgPnl.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Best/Worst</div>
                          <div className="text-sm">
                            <span className="text-neon-green">
                              +${perf.bestTrade.toFixed(2)}
                            </span>
                            {' / '}
                            <span className="text-neon-red">
                              ${perf.worstTrade.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No trades recorded with this setup yet
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};
