import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { UserMenu } from '@/components/layout/UserMenu';
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
import { TourButton } from '@/components/tour/TourButton';
import { Breadcrumbs } from '@/components/Breadcrumbs';

// Session storage key for scroll positions
const SCROLL_POSITIONS_KEY = 'app_scroll_positions';

/**
 * AppShell - Persistent application shell for authenticated routes
 * Prevents sidebar/header remounting on navigation using React Router's Outlet
 * Implements scroll position restoration per route
 */
export function AppShell() {
  useReminderNotifications();
  const { isCollapsed, setIsCollapsed } = useSidebarState();
  const location = useLocation();
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Save scroll position on route change
  useEffect(() => {
    const saveScrollPosition = () => {
      if (mainContentRef.current) {
        const scrollPos = mainContentRef.current.scrollTop;
        const positions = JSON.parse(
          sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}'
        );
        positions[location.pathname + location.search] = scrollPos;
        sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(positions));
      }
    };

    // Save current position before route changes
    return () => {
      saveScrollPosition();
    };
  }, [location]);

  // Restore scroll position when route changes
  useEffect(() => {
    if (mainContentRef.current) {
      const positions = JSON.parse(
        sessionStorage.getItem(SCROLL_POSITIONS_KEY) || '{}'
      );
      const savedPosition = positions[location.pathname + location.search];
      
      if (savedPosition !== undefined) {
        // Restore saved position
        requestAnimationFrame(() => {
          if (mainContentRef.current) {
            mainContentRef.current.scrollTop = savedPosition;
          }
        });
      } else {
        // New route, scroll to top
        requestAnimationFrame(() => {
          if (mainContentRef.current) {
            mainContentRef.current.scrollTop = 0;
          }
        });
      }
    }

    // Move focus to main content for accessibility
    const h1 = document.querySelector('h1');
    if (h1 && 'focus' in h1) {
      (h1 as HTMLElement).setAttribute('tabindex', '-1');
      (h1 as HTMLElement).focus();
    }
  }, [location]);

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
        {/* Persistent Sidebar - Never remounts */}
        <div data-tour="sidebar-menu">
          <AppSidebar />
        </div>

        <div className="flex-1 flex flex-col mobile-safe overflow-hidden h-screen relative">
          {/* Desktop Header - Persistent */}
          <header className="hidden md:flex h-16 border-b border-border/50 backdrop-blur-xl glass-subtle items-center justify-between gap-4 px-6 sticky top-0 z-30" role="banner" aria-label="Main navigation header">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hover:bg-muted/50 rounded-lg p-2 transition-colors" />
              <AccountSwitcher />
            </div>

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

          {/* Mobile Header - Persistent */}
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
            {/* Main content with scroll restoration */}
            <main 
              id="main-content" 
              ref={mainContentRef}
              className="flex-1 p-3 md:p-6 overflow-y-auto overflow-x-hidden pb-20 md:pb-6 custom-scrollbar mobile-safe" 
              role="main" 
              aria-label="Main content"
            >
              <Breadcrumbs />
              {/* React Router Outlet with Page Transitions */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.4, 0, 0.2, 1], // cubic-bezier easing for smooth motion
                  }}
                  className="w-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
          
          {/* Persistent Mobile Navigation */}
          <MobileNav />
          <QuickAddTrade />
          <InstallPrompt />
        </div>
      </div>
    </SidebarProvider>
  );
}
