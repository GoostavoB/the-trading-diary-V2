import { BarChart3, Upload, TrendingUp, Target, Brain, Trophy, Settings2, BookOpen, HelpCircle, LineChart, LogOut, Zap, Sparkles, RefreshCw, Wallet, Receipt } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarCryptoWidget } from '@/components/SidebarCryptoWidget';
import { GamificationSidebar } from '@/components/gamification/GamificationSidebar';
import { useTranslation } from '@/hooks/useTranslation';

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const mainItems = [
    { title: t('navigation.dashboard'), url: '/dashboard', icon: BarChart3 },
    { title: t('trades.addTrade'), url: '/upload', icon: Upload },
    { title: t('navigation.exchanges'), url: '/exchanges', icon: RefreshCw },
    { title: t('navigation.spotWallet'), url: '/spot-wallet', icon: Wallet },
    { title: t('navigation.analytics'), url: '/analytics', icon: TrendingUp },
    { title: t('navigation.feeAnalysis'), url: '/fee-analysis', icon: Receipt },
    { title: t('navigation.marketData'), url: '/market-data', icon: LineChart },
    { title: t('navigation.forecast'), url: '/forecast', icon: Target },
    { title: t('navigation.aiTools'), url: '/ai-tools', icon: Brain },
    { title: 'Progress & XP', url: '/gamification', icon: Zap },
    { title: 'My Metrics', url: '/custom/my-metrics', icon: Sparkles },
    { title: t('navigation.achievements'), url: '/achievements', icon: Trophy },
    { title: t('common.settings'), url: '/settings', icon: Settings2 },
  ];

  const resourceItems = [
    { title: t('navigation.blog'), url: '/blog', icon: BookOpen },
    { title: t('navigation.faq'), url: '/faq', icon: HelpCircle },
  ];

  const isActive = (path: string) => location.pathname === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-muted text-foreground font-medium'
      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground';

  return (
    <Sidebar collapsible="icon" className="sticky top-0 h-screen border-r border-border/50 backdrop-blur-xl bg-[#0f0f11] glass shadow-level-2 z-40">
      <div className="p-4 border-b border-border/50 flex items-center justify-center">
        <Logo size={open ? "md" : "sm"} variant={open ? "horizontal" : "icon"} showText={open} />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('navigation.home')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t('landing.footer.support')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gamification & Crypto Widgets */}
        <div className="mt-auto space-y-0">
          {/* Gamification Widget */}
          <div className="border-t border-border/50 px-4 py-3">
            <GamificationSidebar />
          </div>

          {/* Crypto Prices Widget */}
          <div className="border-t border-border/50">
            <SidebarCryptoWidget />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip={t('auth.signOut')} className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('auth.signOut')}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
