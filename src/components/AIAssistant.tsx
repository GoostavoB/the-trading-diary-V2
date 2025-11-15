import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { supabase } from '@/integrations/supabase/client';
import { preprocessUserMessage } from '@/utils/tradingGlossary';
import { useTranslation } from '@/hooks/useTranslation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant = () => {
  const { t } = useTranslation();
  const { isOpen, setIsOpen, initialPrompt, clearInitialPrompt } = useAIAssistant();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: t('aiAssistant.greeting'),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle initial prompt when provided
  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInput(initialPrompt);
      clearInitialPrompt();
    }
  }, [initialPrompt, isOpen, clearInitialPrompt]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Preprocess message to expand trading acronyms
    const processedInput = preprocessUserMessage(input);
    const userMessage: Message = { role: 'user', content: processedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get the user's JWT token from the session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-dashboard-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get AI response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantMessage += content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === 'assistant') {
                    newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantMessage };
                  } else {
                    newMessages.push({ role: 'assistant', content: assistantMessage });
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete JSON
            }
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage = error instanceof Error 
        ? `Sorry, I encountered an error: ${error.message}. Please try again.`
        : t('aiAssistant.error');
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: errorMessage,
      }]);
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed top-6 right-6 rounded-full h-14 w-14 z-[100] bg-gradient-to-br from-accent via-accent to-accent/80 hover:from-accent/90 hover:via-accent hover:to-accent text-accent-foreground shadow-[0_0_30px_hsl(var(--accent)/0.5),0_0_60px_hsl(var(--accent)/0.3),0_10px_40px_-10px_hsl(var(--accent)/0.6)] hover:shadow-[0_0_40px_hsl(var(--accent)/0.7),0_0_80px_hsl(var(--accent)/0.4),0_10px_50px_-10px_hsl(var(--accent)/0.8)] hover:scale-110 transition-all duration-300 animate-pulse-glow before:absolute before:inset-0 before:rounded-full before:animate-breathing-ring md:h-16 md:w-16"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6 md:h-7 md:w-7 relative z-10" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md glass-strong backdrop-blur-xl border-accent/20">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            {t('aiAssistant.title')}
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full py-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-accent text-accent-foreground'
                        : 'glass border border-border/50'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass border border-border/50 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-accent rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="mt-4 flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t('aiAssistant.placeholder')}
              className="resize-none glass border-accent/20"
              rows={2}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-auto bg-accent hover:bg-accent/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
