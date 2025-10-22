import { useState } from 'react';
import { 
  BarChart3, Upload, TrendingUp, Target, Brain, Trophy, Settings2, BookOpen, HelpCircle, 
  LineChart, LogOut, Zap, RefreshCw, Wallet, Receipt, BookMarked, Users, GitCompare, 
  Shield, FileBarChart, ClipboardList, Calendar, Bell, FileText, ChevronDown, Search,
  Plus, Archive, Star, Flame, Award, PieChart
} from 'lucide-react';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarCryptoWidget } from '@/components/SidebarCryptoWidget';
import { SidebarLSRWidget } from '@/components/SidebarLSRWidget';
import { useTranslation } from '@/hooks/useTranslation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MenuItem {
  title: string;
  url: string;
  icon: any;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [archivedGroups, setArchivedGroups] = useState<string[]>([]);

  const menuStructure: MenuGroup[] = [
    {
      label: 'Dashboard',
      defaultOpen: true,
      items: [
        { title: t('navigation.dashboard'), url: '/dashboard', icon: BarChart3 },
      ],
    },
    {
      label: 'Portfolio',
      defaultOpen: true,
      items: [
        { title: t('navigation.spotWallet'), url: '/spot-wallet', icon: Wallet },
        { title: t('navigation.exchanges'), url: '/exchanges', icon: RefreshCw },
        { title: 'Trading Accounts', url: '/accounts', icon: PieChart },
      ],
    },
    {
      label: 'Trades',
      defaultOpen: true,
      items: [
        { title: t('trades.addTrade'), url: '/upload', icon: Plus },
        { title: 'Trade Analysis', url: '/trade-analysis', icon: GitCompare },
        { title: t('navigation.feeAnalysis'), url: '/fee-analysis', icon: Receipt },
        { title: 'Risk Management', url: '/risk-management', icon: Shield },
        { title: 'Trading Journal', url: '/journal', icon: BookMarked },
      ],
    },
    {
      label: 'Analytics',
      defaultOpen: false,
      items: [
        { title: t('navigation.marketData'), url: '/market-data', icon: LineChart },
        { title: t('navigation.forecast'), url: '/forecast', icon: Target },
        { title: 'Economic Calendar', url: '/economic-calendar', icon: Calendar },
        { title: 'Performance Alerts', url: '/performance-alerts', icon: Bell },
      ],
    },
    {
      label: 'Planning',
      defaultOpen: false,
      items: [
        { title: 'Trading Plan', url: '/trading-plan', icon: ClipboardList },
        { title: 'Goals & Milestones', url: '/goals', icon: Target },
        { title: 'Psychology', url: '/psychology', icon: Brain },
      ],
    },
    {
      label: 'Reports',
      defaultOpen: false,
      items: [
        { title: 'Reports', url: '/reports', icon: FileBarChart },
        { title: 'Tax Reports', url: '/tax-reports', icon: FileText },
        { title: 'My Metrics', url: '/my-metrics', icon: Star },
      ],
    },
    {
      label: 'Community',
      defaultOpen: false,
      items: [
        { title: 'Social', url: '/social', icon: Users },
        { title: 'Leaderboard', url: '/leaderboard', icon: Trophy },
        { title: t('navigation.achievements'), url: '/achievements', icon: Award },
        { title: 'Progress & XP', url: '/progress-analytics', icon: Zap },
      ],
    },
  ];

  const isActive = (path: string) => location.pathname === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-muted text-foreground font-medium'
      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground';

  const filteredMenuStructure = menuStructure
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(group => 
      !archivedGroups.includes(group.label) && 
      (searchQuery === '' || group.items.length > 0)
    );

  const archivedMenu = menuStructure.filter(group => archivedGroups.includes(group.label));

  const toggleArchive = (groupLabel: string) => {
    setArchivedGroups(prev =>
      prev.includes(groupLabel)
        ? prev.filter(label => label !== groupLabel)
        : [...prev, groupLabel]
    );
  };

  return (
    <Sidebar collapsible="icon" className="sticky top-0 h-screen border-r border-border/50 backdrop-blur-xl bg-background/95 shadow-lg z-40">
      <div className="p-4 border-b border-border/50 flex items-center justify-center">
        <Logo size={open ? "md" : "sm"} variant={open ? "horizontal" : "icon"} showText={open} />
      </div>

      <SidebarContent>
        {/* Search */}
        {open && (
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        )}

        {/* Main Menu Groups */}
        {filteredMenuStructure.map((group) => (
          <Collapsible key={group.label} defaultOpen={group.defaultOpen} className="group/collapsible">
            <SidebarGroup>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between group-data-[state=open]/collapsible:text-primary">
                  {group.label}
                  <div className="flex items-center gap-1">
                    {open && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover/collapsible:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleArchive(group.label);
                        }}
                      >
                        <Archive className="h-3 w-3" />
                      </Button>
                    )}
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </div>
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild tooltip={item.title}>
                          <NavLink to={item.url} end className={getNavCls}>
                            <item.icon className="h-4 w-4" />
                            {open && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* Archived Menu */}
        {archivedMenu.length > 0 && open && (
          <Collapsible>
            <SidebarGroup>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Archived ({archivedMenu.length})
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {archivedMenu.map((group) => (
                      <SidebarMenuItem key={group.label}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-muted-foreground hover:text-foreground"
                          onClick={() => toggleArchive(group.label)}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Restore {group.label}
                        </Button>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t('common.settings')}>
                  <NavLink to="/settings" end className={getNavCls}>
                    <Settings2 className="h-4 w-4" />
                    {open && <span>{t('common.settings')}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Market Widgets */}
        {open && (
          <div className="mt-auto space-y-0">
            <div className="border-t border-border/50">
              <SidebarLSRWidget />
            </div>
            <div className="border-t border-border/50">
              <SidebarCryptoWidget />
            </div>
          </div>
        )}

        {/* Sign Out */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip={t('auth.signOut')} className="text-muted-foreground hover:text-foreground hover:bg-muted/50">
                  <LogOut className="h-4 w-4" />
                  {open && <span>{t('auth.signOut')}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
