import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant } from '@/contexts/AIAssistantContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant = () => {
  const { isOpen, setIsOpen, initialPrompt, clearInitialPrompt } = useAIAssistant();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your trading analytics assistant. Ask me anything about your performance, metrics, or request custom widgets.',
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

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-dashboard-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-2xl shadow-accent/50 glass-strong hover:scale-110 transition-all duration-300 z-[100] animate-pulse-subtle"
          aria-label="Open AI Assistant"
        >
          <Bot className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md glass-strong backdrop-blur-xl border-accent/20">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            AI Trading Assistant
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
                        ? 'bg-accent text-white'
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
              placeholder="Ask about your trading performance..."
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
