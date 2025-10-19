import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GlassCard } from '@/components/ui/glass-card';

interface AIWidgetCreatorProps {
  menuItemId?: string;
  onWidgetCreated?: () => void;
}

export const AIWidgetCreator = ({ menuItemId, onWidgetCreated }: AIWidgetCreatorProps) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const examples = [
    "Create a setup rank in terms of ROI",
    "Show a summary of my trades from the last 6 months",
    "Add a box comparing my average profit factor by broker",
    "Display a heatmap of my win rate by hour of day",
    "Show which assets I perform best on"
  ];

  const generateWidget = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a description of the widget you want',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get trades summary for context
      const { data: trades } = await supabase
        .from('trades')
        .select('symbol, setup, broker, pnl, roi, side')
        .eq('user_id', user.id)
        .limit(100);

      const tradesSummary = {
        total_trades: trades?.length || 0,
        unique_symbols: [...new Set(trades?.map(t => t.symbol) || [])],
        unique_setups: [...new Set(trades?.map(t => t.setup) || [])],
        unique_brokers: [...new Set(trades?.map(t => t.broker) || [])]
      };

      // Call AI to generate widget config
      const { data: widgetConfig, error: aiError } = await supabase.functions.invoke(
        'ai-generate-widget',
        {
          body: { prompt, tradesSummary }
        }
      );

      if (aiError) throw aiError;
      if (!widgetConfig) throw new Error('No widget configuration generated');

      console.log('Generated widget config:', widgetConfig);

      // Save widget to database
      const { error: dbError } = await supabase.from('custom_dashboard_widgets').insert({
        user_id: user.id,
        menu_item_id: menuItemId || null,
        title: widgetConfig.title,
        description: widgetConfig.description,
        widget_type: widgetConfig.widget_type,
        query_config: widgetConfig.query_config,
        display_config: widgetConfig.display_config,
        position_x: 0,
        position_y: 0,
        width: widgetConfig.widget_type === 'metric' ? 3 : 6,
        height: widgetConfig.widget_type === 'metric' ? 2 : 4,
      });

      if (dbError) throw dbError;

      toast({
        title: 'Widget Created!',
        description: `"${widgetConfig.title}" has been added to your dashboard`,
      });

      setPrompt('');
      setOpen(false);
      onWidgetCreated?.();
    } catch (error: any) {
      console.error('Error generating widget:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate widget. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Create AI Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Widget Creator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Describe the metric or analytics box you want to create, and AI will generate it for you.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">What would you like to analyze?</label>
            <Textarea
              placeholder="e.g., Create a setup rank in terms of ROI"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Example prompts:</p>
            <div className="grid gap-2">
              {examples.map((example, idx) => (
                <GlassCard
                  key={idx}
                  className="p-2 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setPrompt(example)}
                >
                  <p className="text-xs">{example}</p>
                </GlassCard>
              ))}
            </div>
          </div>

          <Button
            onClick={generateWidget}
            disabled={loading || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Widget...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Widget
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};