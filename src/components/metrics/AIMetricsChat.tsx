import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, SkipForward } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTradesContext } from '@/hooks/useTradesContext';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface WidgetConfig {
  title: string;
  description: string;
  category: string;
  visualization_type: string;
  data_config: any;
  display_format: any;
}

interface AIMetricsChatProps {
  onWidgetCreated?: (widget: WidgetConfig) => void;
}

export const AIMetricsChat = ({ onWidgetCreated }: AIMetricsChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI metrics assistant. Tell me what you'd like to track or measure in your trading, and I'll create a custom widget for you. For example, 'Show me my best setups by ROI' or 'Track my win rate by hour'."
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<'clarify' | 'generate'>('clarify');
  const [pendingWidget, setPendingWidget] = useState<WidgetConfig | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: tradesContext, isLoading: contextLoading } = useTradesContext();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (userMessage?: string) => {
    const messageToSend = userMessage || input.trim();
    if (!messageToSend || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: messageToSend }
    ];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-metrics-assistant', {
        body: {
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          tradesContext,
          action: currentAction
        }
      });

      if (error) throw error;

      console.log('AI Response:', data);

      // Check if this is a widget config response
      if (data.widget) {
        setPendingWidget(data.widget);
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: data.summary || `I've created "${data.widget.title}" for you. This ${data.widget.visualization_type.replace('_', ' ')} ${data.widget.description}. Would you like to add it to your dashboard?`
          }
        ]);
        setCurrentAction('clarify'); // Reset for next widget
      } else if (data.questions) {
        // AI is asking clarifying questions
        const questionsText = data.questions
          .map((q: any) => `${q.question}\nOptions: ${q.options.join(', ')}\nDefault: ${q.default}`)
          .join('\n\n');
        setMessages([
          ...newMessages,
        {
          role: 'assistant',
          content: `${questionsText}\n\n(You can answer, or type "skip" to use defaults, or say "just create it")`
        }
        ]);
      } else {
        // Regular conversational response
        setMessages([
          ...newMessages,
          { role: 'assistant', content: data.message || 'Could you please provide more details about what you would like to track?' }
        ]);
      }

      // Check if user wants to skip to generation
      if (messageToSend.toLowerCase().includes('skip') || messageToSend.toLowerCase().includes('just create')) {
        setCurrentAction('generate');
      }

    } catch (error: any) {
      console.error('Error calling AI:', error);
      toast.error(error.message || 'Failed to get AI response');
      setMessages([...newMessages, {
        role: 'assistant',
        content: "I'm having trouble processing that. Could you try rephrasing your request?"
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = async () => {
    if (!pendingWidget) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('custom_dashboard_widgets')
        .insert({
          title: pendingWidget.title,
          description: pendingWidget.description,
          is_permanent: true,
          created_via: 'ai_assistant',
          ai_prompt: messages.find(m => m.role === 'user')?.content || ''
        });

      if (error) throw error;

      toast.success('Widget added to My Metrics!');
      setPendingWidget(null);
      
      if (onWidgetCreated) {
        onWidgetCreated(pendingWidget);
      }

      // Reset conversation
      setMessages([
        {
          role: 'assistant',
          content: `Great! "${pendingWidget.title}" has been added to your metrics. What else would you like to track?`
        }
      ]);
      setCurrentAction('clarify');

    } catch (error: any) {
      console.error('Error saving widget:', error);
      toast.error('Failed to save widget');
    }
  };

  const handleSkip = () => {
    setCurrentAction('generate');
    handleSend('Just create it with default settings');
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Metrics Creator</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {contextLoading ? 'Loading your trading data...' : `${tradesContext?.totalTrades || 0} trades analyzed`}
        </p>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {pendingWidget ? (
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium">{pendingWidget.title}</p>
              <p className="text-xs text-muted-foreground">{pendingWidget.description}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPendingWidget(null);
                  setMessages([...messages, {
                    role: 'assistant',
                    content: "No problem. What would you like to change?"
                  }]);
                }}
              >
                Refine
              </Button>
              <Button size="sm" onClick={handleAddWidget}>
                Add to Metrics
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Show my top 5 setups by win rate..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={loading || contextLoading}
            />
            {currentAction === 'clarify' && messages.length > 1 && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleSkip}
                disabled={loading}
                title="Skip questions and use defaults"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading || contextLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
