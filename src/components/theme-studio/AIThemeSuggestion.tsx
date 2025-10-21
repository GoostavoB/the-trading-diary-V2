import { useAIThemeSuggestions } from '@/hooks/useAIThemeSuggestions';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useThemeUnlocks } from '@/hooks/useThemeUnlocks';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb } from 'lucide-react';

export const AIThemeSuggestion = () => {
  const { suggestion, hasSuggestion } = useAIThemeSuggestions();
  const { setThemeMode, themeMode } = useThemeMode();
  const { isThemeUnlocked } = useThemeUnlocks();

  if (!hasSuggestion || !suggestion) return null;

  const isUnlocked = isThemeUnlocked(suggestion.theme.id);
  const isActive = themeMode === suggestion.theme.id;

  if (!isUnlocked) return null; // Don't suggest locked themes
  if (isActive) return null; // Don't suggest already active theme

  return (
    <div className="px-4 pb-4">
      <div className="p-4 rounded-lg border border-border/30 bg-gradient-to-br from-accent/5 to-primary/5">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <h4 className="text-xs font-semibold text-primary">AI Suggestion</h4>
            </div>
            <p className="text-sm font-medium mb-1">{suggestion.theme.name}</p>
            <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setThemeMode(suggestion.theme.id)}
              className="mt-3 w-full"
            >
              Try it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
