import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { UserMenu } from './UserMenu';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import { useSidebarState } from '@/hooks/useSidebarState';
import { ThemeToggle } from '@/components/ThemeToggle';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { MobileNav } from '@/components/mobile/MobileNav';
import { QuickAddTrade } from '@/components/mobile/QuickAddTrade';
import { InstallPrompt } from '@/components/mobile/InstallPrompt';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  // Enable reminder notifications
  useReminderNotifications();
  const { isCollapsed, setIsCollapsed } = useSidebarState();

  return (
    <SidebarProvider defaultOpen={!isCollapsed} onOpenChange={setIsCollapsed}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-secondary/30 to-background mobile-safe">
        <AppSidebar />
        <div className="flex-1 flex flex-col mobile-safe">
          <header className="h-14 border-b border-border/50 backdrop-blur-xl bg-card/50 flex items-center justify-between gap-2 px-3 md:px-6">
            <div className="flex items-center gap-2 md:gap-3">
              <SidebarTrigger className="hover:bg-muted/50 rounded-lg p-2 transition-colors" />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <KeyboardShortcutsHelp />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto pb-20 md:pb-6 custom-scrollbar mobile-safe">
            {children}
          </main>
          <MobileNav />
          <QuickAddTrade />
          <InstallPrompt />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
