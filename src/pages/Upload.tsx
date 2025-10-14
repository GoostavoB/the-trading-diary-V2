import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset: '',
    setup: '',
    broker: '',
    entry_price: '',
    exit_price: '',
    position_size: '',
    emotional_tag: '',
    notes: '',
    duration_minutes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const entry = parseFloat(formData.entry_price);
    const exit = parseFloat(formData.exit_price);
    const size = parseFloat(formData.position_size);
    
    const pnl = (exit - entry) * size;
    const roi = ((exit - entry) / entry) * 100;

    const { error } = await supabase.from('trades').insert({
      user_id: user.id,
      asset: formData.asset,
      setup: formData.setup,
      broker: formData.broker,
      entry_price: entry,
      exit_price: exit,
      position_size: size,
      pnl: pnl,
      roi: roi,
      emotional_tag: formData.emotional_tag,
      notes: formData.notes,
      duration_minutes: parseInt(formData.duration_minutes) || 0,
      trade_date: new Date().toISOString()
    });

    setLoading(false);

    if (error) {
      toast.error('Failed to save trade');
    } else {
      toast.success('Trade added successfully!');
      navigate('/dashboard');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Upload Trade</h1>
          <p className="text-muted-foreground">Record your trading activity</p>
        </div>

        <Card className="p-6 bg-card border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Asset</label>
                <Input
                  value={formData.asset}
                  onChange={(e) => setFormData({...formData, asset: e.target.value})}
                  placeholder="BTC/USD"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Setup</label>
                <Input
                  value={formData.setup}
                  onChange={(e) => setFormData({...formData, setup: e.target.value})}
                  placeholder="Breakout, Reversal..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Broker</label>
                <Input
                  value={formData.broker}
                  onChange={(e) => setFormData({...formData, broker: e.target.value})}
                  placeholder="Your broker"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Emotional Tag</label>
                <Input
                  value={formData.emotional_tag}
                  onChange={(e) => setFormData({...formData, emotional_tag: e.target.value})}
                  placeholder="Confident, Fearful..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Entry Price</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={formData.entry_price}
                  onChange={(e) => setFormData({...formData, entry_price: e.target.value})}
                  placeholder="0.00"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Exit Price</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={formData.exit_price}
                  onChange={(e) => setFormData({...formData, exit_price: e.target.value})}
                  placeholder="0.00"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Position Size</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={formData.position_size}
                  onChange={(e) => setFormData({...formData, position_size: e.target.value})}
                  placeholder="0.00"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                  placeholder="30"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Trade notes, observations..."
                className="mt-1"
                rows={4}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {loading ? 'Saving...' : 'Save Trade'}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Upload;
