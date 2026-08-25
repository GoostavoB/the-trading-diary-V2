import { ReactNode } from 'react';
import { TopNavigation } from './TopNavigation';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import { ThemeUnlockNotification } from '@/components/theme-studio/ThemeUnlockNotification';
import { MobileNav } from '@/components/mobile/MobileNav';
import { QuickAddTrade } from '@/components/mobile/QuickAddTrade';
import { InstallPrompt } from '@/components/mobile/InstallPrompt';
import { GuidedTour } from '@/components/tour/GuidedTour';
import { UpdatesModal } from '@/components/tour/UpdatesModal';
import { RiskCopilotDrawer } from '@/components/risk-copilot/RiskCopilotDrawer';
import { MonthCloseModal } from '@/components/risk-copilot/MonthCloseModal';

interface AppLayoutProps {
  children: ReactNode;
  isGamificationOpen?: boolean;
  onGamificationToggle?: () => void;
}

const AppLayout = ({
  children,
  isGamificationOpen,
  onGamificationToggle
}: AppLayoutProps) => {
  useReminderNotifications();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <ThemeUnlockNotification />
      <UpdatesModal />
      <GuidedTour />
      <RiskCopilotDrawer />
      <MonthCloseModal />

      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Content */}
      <main className="flex-1 w-full px-4 py-6 md:px-6 md:py-8 overflow-x-hidden pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Floating Actions */}
      <div className="md:hidden">
        <MobileNav />
        <QuickAddTrade />
      </div>

      <InstallPrompt />
    </div>
  );
};

export default AppLayout;