import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Keyboard } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export const KeyboardShortcutsHelp = () => {
  const { t } = useTranslation();

  const shortcuts = [
    {
      category: t('keyboardShortcuts.categories.navigation'),
      items: [
        { keys: ['Alt', 'D'], description: t('keyboardShortcuts.shortcuts.goToDashboard') },
        { keys: ['Alt', 'U'], description: t('keyboardShortcuts.shortcuts.goToUpload') },
        { keys: ['Alt', 'F'], description: t('keyboardShortcuts.shortcuts.goToForecast') },
        { keys: ['Alt', 'A'], description: t('keyboardShortcuts.shortcuts.goToAnalytics') },
        { keys: ['Alt', 'T'], description: t('keyboardShortcuts.shortcuts.goToTools') },
        { keys: ['Alt', 'H'], description: t('keyboardShortcuts.shortcuts.goToHome') },
        { keys: ['Alt', 'S'], description: t('keyboardShortcuts.shortcuts.goToSettings') },
      ],
    },
    {
      category: t('keyboardShortcuts.categories.dashboardActions'),
      items: [
        { keys: ['N'], description: t('keyboardShortcuts.shortcuts.addNewTrade') },
        { keys: ['E'], description: t('keyboardShortcuts.shortcuts.exportTrades') },
        { keys: ['C'], description: t('keyboardShortcuts.shortcuts.customizeDashboard') },
        { keys: ['Tab'], description: t('keyboardShortcuts.shortcuts.navigateSections') },
      ],
    },
    {
      category: t('keyboardShortcuts.categories.general'),
      items: [
        { keys: ['Shift', '?'], description: t('keyboardShortcuts.shortcuts.showShortcuts') },
        { keys: ['Esc'], description: t('keyboardShortcuts.shortcuts.closeDialogs') },
        { keys: ['Ctrl', 'K'], description: t('keyboardShortcuts.shortcuts.focusSearch') },
        { keys: ['Ctrl', '/'], description: t('keyboardShortcuts.shortcuts.toggleSidebar') },
      ],
    },
  ];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Keyboard Shortcuts (Shift + ?)">
          <Keyboard className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('keyboardShortcuts.title')}</DialogTitle>
          <DialogDescription>
            {t('keyboardShortcuts.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, index) => (
                  <PremiumCard
                    key={index}
                    className="p-3 bg-muted/30 border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <kbd
                            key={keyIndex}
                            className="px-2 py-1 text-xs font-semibold bg-card border border-border rounded shadow-sm"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  </PremiumCard>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t border-border">
          {t('keyboardShortcuts.footerPrefix')} <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-semibold">Shift</kbd> +{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-semibold">?</kbd> {t('keyboardShortcuts.footer')}
        </div>
      </DialogContent>
    </Dialog>
  );
};
