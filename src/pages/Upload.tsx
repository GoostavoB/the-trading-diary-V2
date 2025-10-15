import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload as UploadIcon, X } from 'lucide-react';
import { Label } from '@/components/ui/label';

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
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

  useEffect(() => {
    if (editId) {
      fetchTrade(editId);
    }
  }, [editId]);

  const fetchTrade = async (id: string) => {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load trade');
      return;
    }

    if (data) {
      setFormData({
        asset: data.asset,
        setup: data.setup || '',
        broker: data.broker || '',
        entry_price: data.entry_price.toString(),
        exit_price: data.exit_price.toString(),
        position_size: data.position_size.toString(),
        emotional_tag: data.emotional_tag || '',
        notes: data.notes || '',
        duration_minutes: data.duration_minutes?.toString() || ''
      });
      if (data.screenshot_url) {
        setScreenshotPreview(data.screenshot_url);
      }
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Screenshot must be less than 5MB');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const uploadScreenshot = async (tradeId: string): Promise<string | null> => {
    if (!screenshot || !user) return null;

    const fileExt = screenshot.name.split('.').pop();
    const fileName = `${user.id}/${tradeId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('trade-screenshots')
      .upload(fileName, screenshot, { upsert: true });

    if (uploadError) {
      console.error('Screenshot upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('trade-screenshots')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const entry = parseFloat(formData.entry_price);
    const exit = parseFloat(formData.exit_price);
    const size = parseFloat(formData.position_size);
    
    const pnl = (exit - entry) * size;
    const roi = ((exit - entry) / entry) * 100;

    const tradeData = {
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
    };

    let error;
    let tradeId = editId;

    if (editId) {
      // Update existing trade
      const { error: updateError } = await supabase
        .from('trades')
        .update(tradeData)
        .eq('id', editId);
      error = updateError;
    } else {
      // Insert new trade
      const { data, error: insertError } = await supabase
        .from('trades')
        .insert(tradeData)
        .select()
        .single();
      error = insertError;
      tradeId = data?.id;
    }

    // Upload screenshot if provided
    if (screenshot && tradeId) {
      const screenshotUrl = await uploadScreenshot(tradeId);
      if (screenshotUrl) {
        await supabase
          .from('trades')
          .update({ screenshot_url: screenshotUrl })
          .eq('id', tradeId);
      }
    }

    setLoading(false);

    if (error) {
      toast.error('Failed to save trade');
    } else {
      toast.success(editId ? 'Trade updated successfully!' : 'Trade added successfully!');
      navigate('/dashboard');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{editId ? 'Edit Trade' : 'Upload Trade'}</h1>
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Trade notes, observations..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="screenshot">Trade Screenshot (Optional)</Label>
              <div className="mt-2">
                {screenshotPreview ? (
                  <div className="relative">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full h-48 object-cover rounded-md border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeScreenshot}
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="screenshot"
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-foreground/50 transition-colors"
                  >
                    <UploadIcon className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload screenshot (max 5MB)
                    </p>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleScreenshotChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              {loading ? 'Saving...' : editId ? 'Update Trade' : 'Save Trade'}
            </Button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Upload;
