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
  keywords?: string[]; // Semantic search keywords
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
        { title: t('navigation.dashboard'), url: '/dashboard', icon: BarChart3, keywords: ['overview', 'home', 'main', 'summary', 'performance', 'stats', 'view', 'monitor'] },
      ],
    },
    {
      label: 'Portfolio',
      defaultOpen: true,
      items: [
        { title: t('navigation.spotWallet'), url: '/spot-wallet', icon: Wallet, keywords: ['balance', 'holdings', 'assets', 'tokens', 'coins', 'crypto', 'portfolio', 'funds', 'money', 'cash'] },
        { title: t('navigation.exchanges'), url: '/exchanges', icon: RefreshCw, keywords: ['binance', 'bybit', 'api', 'connect', 'sync', 'integration', 'platform', 'broker', 'exchange'] },
        { title: 'Trading Accounts', url: '/accounts', icon: PieChart, keywords: ['accounts', 'wallets', 'manage', 'profiles', 'multiple', 'organize'] },
      ],
    },
    {
      label: 'Trades',
      defaultOpen: true,
      items: [
        { title: t('trades.addTrade'), url: '/upload', icon: Plus, keywords: ['new', 'create', 'add', 'import', 'log', 'record', 'entry', 'manual', 'input', 'enter'] },
        { title: 'Trade Analysis', url: '/trade-analysis', icon: GitCompare, keywords: ['performance', 'results', 'stats', 'pairs', 'setups', 'review', 'analyze', 'study', 'examine', 'history'] },
        { title: t('navigation.feeAnalysis'), url: '/fee-analysis', icon: Receipt, keywords: ['costs', 'expenses', 'commissions', 'charges', 'fees', 'trading fees', 'funding', 'breakdown'] },
        { title: 'Risk Management', url: '/risk-management', icon: Shield, keywords: ['position sizing', 'drawdown', 'exposure', 'risk', 'safety', 'protection', 'loss', 'stop loss', 'leverage'] },
        { title: 'Trading Journal', url: '/journal', icon: BookMarked, keywords: ['notes', 'diary', 'log', 'thoughts', 'lessons', 'reflection', 'review', 'write', 'document'] },
      ],
    },
    {
      label: 'Analytics',
      defaultOpen: false,
      items: [
        { title: t('navigation.marketData'), url: '/market-data', icon: LineChart, keywords: ['prices', 'charts', 'market', 'data', 'volatility', 'volume', 'crypto prices', 'btc', 'eth', 'trends'] },
        { title: t('navigation.forecast'), url: '/forecast', icon: Target, keywords: ['prediction', 'projections', 'models', 'signals', 'forecast', 'future', 'estimate', 'predict'] },
        { title: 'Economic Calendar', url: '/economic-calendar', icon: Calendar, keywords: ['events', 'news', 'macro', 'economy', 'calendar', 'schedule', 'announcements', 'fed', 'inflation'] },
        { title: 'Performance Alerts', url: '/performance-alerts', icon: Bell, keywords: ['notifications', 'alerts', 'warnings', 'triggers', 'monitoring', 'notify', 'remind', 'alarm'] },
      ],
    },
    {
      label: 'Planning',
      defaultOpen: false,
      items: [
        { title: 'Trading Plan', url: '/trading-plan', icon: ClipboardList, keywords: ['strategy', 'rules', 'checklist', 'plan', 'system', 'framework', 'setup', 'prepare', 'routine'] },
        { title: 'Goals & Milestones', url: '/goals', icon: Target, keywords: ['targets', 'objectives', 'goals', 'milestones', 'achievements', 'progress', 'aim', 'ambition', 'success'] },
        { title: 'Psychology', url: '/psychology', icon: Brain, keywords: ['emotions', 'feelings', 'mental', 'mindset', 'bias', 'mood', 'discipline', 'behavior', 'emotional', 'psychology', 'thinking', 'cognition', 'stress', 'anxiety', 'confidence', 'fear', 'greed', 'calm', 'state', 'mind', 'mental health', 'wellbeing'] },
      ],
    },
    {
      label: 'Reports',
      defaultOpen: false,
      items: [
        { title: 'Reports', url: '/reports', icon: FileBarChart, keywords: ['export', 'download', 'report', 'summary', 'kpi', 'metrics', 'analysis', 'monthly', 'weekly', 'period'] },
        { title: 'Tax Reports', url: '/tax-reports', icon: FileText, keywords: ['tax', 'gains', 'losses', 'fifo', 'lifo', 'irs', 'accounting', 'fiscal', 'revenue', 'income'] },
        { title: 'My Metrics', url: '/my-metrics', icon: Star, keywords: ['custom', 'kpi', 'benchmarks', 'personal', 'metrics', 'indicators', 'measure', 'track', 'performance'] },
      ],
    },
    {
      label: 'Community',
      defaultOpen: false,
      items: [
        { title: 'Social', url: '/social', icon: Users, keywords: ['feed', 'community', 'share', 'posts', 'follow', 'social', 'network', 'friends', 'traders'] },
        { title: 'Leaderboard', url: '/leaderboard', icon: Trophy, keywords: ['rankings', 'top', 'competition', 'leaderboard', 'leaders', 'best', 'winners', 'rank', 'compete'] },
        { title: t('navigation.achievements'), url: '/achievements', icon: Award, keywords: ['badges', 'awards', 'achievements', 'trophies', 'rewards', 'unlocks', 'earn', 'win', 'accomplish'] },
        { title: 'Progress & XP', url: '/progress-analytics', icon: Zap, keywords: ['level', 'xp', 'experience', 'progress', 'growth', 'streaks', 'challenges', 'gamification', 'points'] },
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
      items: group.items.filter(item => {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const keywordsMatch = item.keywords?.some(keyword => 
          keyword.toLowerCase().includes(query)
        );
        return titleMatch || keywordsMatch;
      }),
    }))
    .filter(group => 
      !archivedGroups.includes(group.label) && 
      (searchQuery === '' || group.items.length > 0)
    );

  // Helper to check if an item matches the search
  const itemMatchesSearch = (item: MenuItem) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(query);
    const keywordsMatch = item.keywords?.some(keyword => 
      keyword.toLowerCase().includes(query)
    );
    return titleMatch || keywordsMatch;
  };

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
          <Collapsible 
            key={group.label} 
            defaultOpen={group.defaultOpen || searchQuery !== ''} 
            open={searchQuery !== '' ? true : undefined}
            className="group/collapsible"
          >
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
                    {group.items.map((item) => {
                      const isHighlighted = searchQuery !== '' && itemMatchesSearch(item);
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild tooltip={item.title}>
                            <NavLink 
                              to={item.url} 
                              end 
                              className={cn(
                                getNavCls,
                                isHighlighted && "ring-2 ring-primary/50 bg-primary/10"
                              )}
                            >
                              <item.icon className="h-4 w-4" />
                              {open && <span>{item.title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
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
