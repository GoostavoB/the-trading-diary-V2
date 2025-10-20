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
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, LayoutDashboard, BarChart3, Wrench, Users, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  // Enable reminder notifications
  useReminderNotifications();
  const { isCollapsed, setIsCollapsed } = useSidebarState();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/tools', label: 'Tools', icon: Wrench },
    { path: '/social', label: 'Social', icon: Users },
    { path: '/upload', label: 'Upload', icon: Upload },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <SidebarProvider defaultOpen={!isCollapsed} onOpenChange={setIsCollapsed}>
      <div className="min-h-screen flex w-full mobile-safe overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col mobile-safe overflow-hidden h-screen">
          {/* Desktop Header */}
          <header className="hidden md:flex h-16 border-b border-border/50 backdrop-blur-xl glass-subtle items-center justify-between gap-4 px-6 sticky top-0 z-30">
            {/* Left: Sidebar trigger */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hover:bg-muted/50 rounded-lg p-2 transition-colors" />
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search trades, analytics..."
                  className="pl-10 glass-subtle border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            {/* Right: Icon Buttons */}
            <div className="flex items-center gap-2">
              <KeyboardShortcutsHelp />
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>

          {/* Mobile Header (Simplified) */}
          <header className="md:hidden h-14 border-b border-border/50 backdrop-blur-xl glass-subtle flex items-center justify-between gap-2 px-3 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hover:bg-muted/50 rounded-lg p-2 transition-colors" />
            </div>
            <div className="flex items-center gap-2">
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
