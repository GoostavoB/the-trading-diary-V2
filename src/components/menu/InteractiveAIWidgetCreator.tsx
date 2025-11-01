import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadLogger } from '@/utils/uploadLogger';
import { GlassCard } from '@/components/ui/glass-card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

interface InteractiveAIWidgetCreatorProps {
  menuItemId?: string;
  onWidgetCreated?: () => void;
}

export const InteractiveAIWidgetCreator = ({ menuItemId, onWidgetCreated }: InteractiveAIWidgetCreatorProps) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Step responses
  const [initialPrompt, setInitialPrompt] = useState('');
  const [clarifications, setClarifications] = useState<string[]>([]);
  const [widgetPreview, setWidgetPreview] = useState<any>(null);

  const resetDialog = () => {
    setStep(1);
    setInitialPrompt('');
    setClarifications([]);
    setWidgetPreview(null);
  };

  const generateClarificationQuestions = async () => {
    if (!initialPrompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please describe what you want to analyze',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get context about available data
      const { data: trades } = await supabase
        .from('trades')
        .select('symbol, setup, broker, pnl, roi, side, period_of_day')
        .eq('user_id', user.id)
        .limit(50);

      const context = {
        unique_symbols: [...new Set(trades?.map(t => t.symbol) || [])],
        unique_setups: [...new Set(trades?.map(t => t.setup) || [])],
        unique_brokers: [...new Set(trades?.map(t => t.broker) || [])],
        sample_data: trades?.[0]
      };

      // Call AI to generate clarification questions
      const { data: questionData, error: questionError } = await supabase.functions.invoke(
        'ai-widget-clarify',
        { body: { prompt: initialPrompt, context } }
      );

      if (questionError) throw questionError;
      if (!questionData?.questions) throw new Error('No questions generated');
      
      setClarifications(questionData.questions);
      setStep(2);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate clarification questions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const [answers, setAnswers] = useState<string[]>([]);

  const generateFinalWidget = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

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

      const fullPrompt = `
Original request: ${initialPrompt}

Clarifications:
${clarifications.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'Not answered'}`).join('\n\n')}

Based on this conversation, generate a widget configuration.`;

      const { data: widgetConfig, error: aiError } = await supabase.functions.invoke(
        'ai-generate-widget',
        { body: { prompt: fullPrompt, tradesSummary } }
      );

      if (aiError) throw aiError;
      if (!widgetConfig) throw new Error('No widget configuration generated');

      setWidgetPreview(widgetConfig);
      setStep(3);
    } catch (error: any) {
      console.error('Error generating widget:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate widget',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveWidget = async () => {
    setLoading(true);
    
    uploadLogger.widgetSave('Starting widget save', {
      title: widgetPreview?.title,
      type: widgetPreview?.widget_type,
      menuItemId
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const error = new Error('Not authenticated');
        uploadLogger.widgetSaveError('Authentication failed', error);
        throw error;
      }

      uploadLogger.widgetSave('User authenticated, inserting widget', { userId: user.id });

      // Insert with .select() to get back the inserted row
      const { data: insertedWidget, error } = await supabase
        .from('custom_dashboard_widgets')
        .insert({
          user_id: user.id,
          menu_item_id: menuItemId || null,
          title: widgetPreview.title,
          description: widgetPreview.description,
          widget_type: widgetPreview.widget_type,
          query_config: widgetPreview.query_config,
          display_config: widgetPreview.display_config,
          position_x: 0,
          position_y: 0,
          width: widgetPreview.widget_type === 'metric' ? 3 : 6,
          height: widgetPreview.widget_type === 'metric' ? 2 : 4,
        })
        .select()
        .single();

      if (error) {
        uploadLogger.widgetSaveError('Database insert failed', error);
        throw error;
      }

      if (!insertedWidget) {
        const err = new Error('Widget insert succeeded but no data returned');
        uploadLogger.widgetSaveError('No data returned from insert', err);
        throw err;
      }

      uploadLogger.success('WidgetSave', 'Widget inserted successfully', { widgetId: insertedWidget.id });

      // Verify the widget persists by reading it back
      uploadLogger.widgetVerification('Verifying widget persists', { widgetId: insertedWidget.id });
      
      const { data: verifiedWidget, error: verifyError } = await supabase
        .from('custom_dashboard_widgets')
        .select('*')
        .eq('id', insertedWidget.id)
        .single();

      if (verifyError || !verifiedWidget) {
        const err = new Error('Widget was inserted but could not be verified');
        uploadLogger.widgetSaveError('Widget verification failed', err);
        throw err;
      }

      uploadLogger.success('WidgetVerify', 'Widget verified and persists', { widgetId: verifiedWidget.id });

      toast({
        title: 'Widget Created!',
        description: `"${widgetPreview.title}" has been added to your dashboard`,
      });

      resetDialog();
      setOpen(false);
      onWidgetCreated?.();
    } catch (error: any) {
      uploadLogger.widgetSaveError('Widget save failed', error);
      
      let errorMessage = 'Failed to save widget';
      if (error.message.includes('authentication')) {
        errorMessage = 'Please sign in again to save widgets';
      } else if (error.code === '23505') {
        errorMessage = 'A widget with this name already exists';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error Saving Widget',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Create AI Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Interactive Widget Creator
          </DialogTitle>
          <DialogDescription>
            Step {step} of 3: {step === 1 ? 'Describe your widget' : step === 2 ? 'Answer clarifying questions' : 'Review & create'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Initial prompt */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>What would you like to analyze?</Label>
              <Textarea
                placeholder="e.g., Create a setup rank in terms of ROI"
                value={initialPrompt}
                onChange={(e) => setInitialPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button
              onClick={generateClarificationQuestions}
              disabled={loading || !initialPrompt.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Clarifications */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Let's make sure I understand exactly what you want:
            </p>

            {clarifications.map((question, idx) => (
              <div key={idx} className="space-y-2">
                <Label className="text-sm font-medium">
                  {idx + 1}. {question}
                </Label>
                <Textarea
                  placeholder="Your answer..."
                  value={answers[idx] || ''}
                  onChange={(e) => {
                    const newAnswers = [...answers];
                    newAnswers[idx] = e.target.value;
                    setAnswers(newAnswers);
                  }}
                  rows={2}
                  className="resize-none"
                />
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={generateFinalWidget}
                disabled={loading || answers.filter(a => a?.trim()).length === 0}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Widget
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Confirm */}
        {step === 3 && widgetPreview && (
          <div className="space-y-4">
            <GlassCard className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{widgetPreview.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{widgetPreview.description}</p>
                </div>
                <Badge>{widgetPreview.widget_type}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Metric</p>
                  <p className="text-sm font-medium">{widgetPreview.query_config?.metric || 'Custom'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Format</p>
                  <p className="text-sm font-medium capitalize">{widgetPreview.display_config?.format || 'number'}</p>
                </div>
                {widgetPreview.query_config?.group_by && (
                  <div>
                    <p className="text-xs text-muted-foreground">Grouped By</p>
                    <p className="text-sm font-medium capitalize">{widgetPreview.query_config.group_by}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-sm text-success">Widget configuration looks good!</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={saveWidget}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Widget
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};