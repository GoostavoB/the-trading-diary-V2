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
import { AIThemeSuggestion } from './AIThemeSuggestion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeUnlockBadge } from './ThemeUnlockBadge';
import { useThemeUnlocks } from '@/hooks/useThemeUnlocks';
import { useEffect, useState } from 'react';

export const ThemeStudio = () => {
  const { pendingUnlocks, clearUnlockBadge } = useThemeUnlocks();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpenStudio = () => {
      setOpen(true);
    };
    
    window.addEventListener('open-theme-studio', handleOpenStudio);
    return () => window.removeEventListener('open-theme-studio', handleOpenStudio);
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && pendingUnlocks > 0) {
      clearUnlockBadge();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-muted/50"
          aria-label="Theme Studio"
        >
          <Palette className="h-5 w-5" />
          <ThemeUnlockBadge count={pendingUnlocks} />
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
