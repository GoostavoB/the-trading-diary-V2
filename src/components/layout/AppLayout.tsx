import { ReactNode, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { UserMenu } from './UserMenu';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import { useSidebarState } from '@/hooks/useSidebarState';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { ThemeStudio } from '@/components/theme-studio/ThemeStudio';
import { ThemeUnlockNotification } from '@/components/theme-studio/ThemeUnlockNotification';
import { MobileNav } from '@/components/mobile/MobileNav';
import { QuickAddTrade } from '@/components/mobile/QuickAddTrade';
import { InstallPrompt } from '@/components/mobile/InstallPrompt';
import { GuidedTour } from '@/components/tour/GuidedTour';
import { UpdatesModal } from '@/components/tour/UpdatesModal';
import { CurrencySelector } from '@/components/CurrencySelector';
import { BlurToggle } from '@/components/BlurToggle';
import { AccountSwitcher } from '@/components/accounts/AccountSwitcher';
import { CreditDisplay } from '@/components/CreditDisplay';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TourButton } from '@/components/tour/TourButton';

interface AppLayoutProps {
  children: ReactNode;
  isGamificationOpen?: boolean;
  onGamificationToggle?: () => void;
}

const AppLayout = ({ children, isGamificationOpen, onGamificationToggle }: AppLayoutProps) => {
  useReminderNotifications();
  const { isCollapsed, setIsCollapsed } = useSidebarState();

  return (
    <SidebarProvider open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <ThemeUnlockNotification />
      <UpdatesModal />
      <GuidedTour />
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>
      <div className="min-h-screen flex w-full mobile-safe overflow-hidden">
        <div data-tour="sidebar-menu">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col mobile-safe overflow-hidden h-screen relative">
          {/* Desktop Header */}
          <header className="hidden md:flex h-16 border-b border-border/50 backdrop-blur-xl glass-subtle items-center justify-between gap-4 px-6 sticky top-0 z-30" role="banner" aria-label="Main navigation header">
            {/* Left: Sidebar trigger */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hover:bg-muted/50 rounded-lg p-2 transition-colors" />
              <AccountSwitcher />
            </div>

            {/* Right: Icon Buttons */}
            <div className="flex items-center gap-2">
              <CreditDisplay variant="default" />
              <CurrencySelector />
              <BlurToggle variant="icon" />
              <KeyboardShortcutsHelp />
              <div data-tour="theme-toggle">
                <ThemeStudio />
              </div>
              <TourButton />
              <div data-tour="settings">
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Mobile Header (Simplified) */}
          <header className="md:hidden h-14 border-b border-border/50 backdrop-blur-xl glass-subtle flex items-center justify-between gap-2 px-3 sticky top-0 z-30" role="banner" aria-label="Mobile navigation header">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hover:bg-muted/50 rounded-lg p-2 transition-colors" />
              <AccountSwitcher />
            </div>
            <div className="flex items-center gap-1">
              <CreditDisplay variant="compact" />
              <CurrencySelector />
              <BlurToggle variant="icon" />
              <KeyboardShortcutsHelp />
              <ThemeStudio />
              <TourButton />
              <UserMenu />
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden relative">
            <main id="main-content" className="flex-1 p-3 md:p-6 overflow-y-auto overflow-x-hidden pb-20 md:pb-6 custom-scrollbar mobile-safe" role="main" aria-label="Main content">
              {children}
            </main>
            
          </div>
          
          <MobileNav />
          <QuickAddTrade />
          <InstallPrompt />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
