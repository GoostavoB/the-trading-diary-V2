import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ThemeStudioHeader } from './ThemeStudioHeader';
import { QuickThemesGrid } from './QuickThemesGrid';
import { CustomThemeManager } from './CustomThemeManager';
import { SeasonalThemeBanner } from './SeasonalThemeBanner';
import { AIThemeSuggestion } from './AIThemeSuggestion';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ThemeStudio = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-muted/50"
          aria-label="Theme Studio"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-[380px] p-0 glass-strong backdrop-blur-xl border-accent/20"
        sideOffset={8}
      >
        <div className="space-y-0">
          {/* Header with Dark Mode Toggle */}
          <ThemeStudioHeader />

          <ScrollArea className="h-[500px]">
            <div className="space-y-6 py-4">
              {/* Seasonal Theme Banner */}
              <SeasonalThemeBanner />

              {/* AI Suggestion */}
              <AIThemeSuggestion />

              {/* Quick Themes Section */}
              <QuickThemesGrid />

              {/* Custom Themes Section */}
              <div className="border-t border-border/20 pt-4">
                <CustomThemeManager />
              </div>
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};
