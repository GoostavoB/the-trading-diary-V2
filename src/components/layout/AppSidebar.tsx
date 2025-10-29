import { useState } from 'react';
import { 
  BarChart3, Upload, TrendingUp, Target, Brain, Trophy, Settings2, BookOpen, HelpCircle, 
  LineChart, LogOut, Zap, RefreshCw, Wallet, Receipt, BookMarked, Users, GitCompare, 
  Shield, FileBarChart, ClipboardList, Calendar, Bell, FileText, ChevronDown, Search,
  Plus, Archive, Star, Flame, Award, PieChart, Heart, Image, Download, Info, Accessibility, TrendingDown, DollarSign
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
import { useFavorites } from '@/hooks/useFavorites';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  keywords?: string[]; // Semantic search keywords
  iconName?: string; // For storing icon name in database
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
  defaultOpen?: boolean;
  dataTour?: string;
}

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [archivedGroups, setArchivedGroups] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const menuStructure: MenuGroup[] = [
    {
      label: t('sidebar.groups.dashboard'),
      defaultOpen: true,
      items: [
        { title: t('navigation.dashboard'), url: '/dashboard', icon: BarChart3, iconName: 'BarChart3', keywords: ['home', 'overview', 'main', 'summary', 'stats', 'statistics', 'metrics', 'performance', 'snapshot', 'widgets', 'customize', 'view', 'monitor', 'landing', 'central', 'hub'] },
      ],
    },
    {
      label: t('sidebar.groups.portfolio'),
      defaultOpen: true,
      dataTour: 'portfolio-group',
      items: [
        { title: t('navigation.spotWallet'), url: '/spot-wallet', icon: Wallet, iconName: 'Wallet', keywords: ['wallet', 'balance', 'tokens', 'holdings', 'assets', 'portfolio', 'allocation', 'distribution', 'coins', 'cryptocurrencies', 'btc', 'eth', 'total', 'value', 'net worth', 'funds', 'money', 'cash', 'crypto'] },
        { title: 'Track Capital', url: '/track-capital', icon: DollarSign, iconName: 'DollarSign', keywords: ['capital', 'deposits', 'withdrawals', 'money', 'funds', 'track', 'manage', 'balance', 'add', 'withdraw', 'cash', 'flow', 'history', 'log', 'investment', 'invested'] },
        // Exchange connections temporarily hidden for future use
        // { title: t('navigation.exchanges'), url: '/exchanges', icon: RefreshCw, iconName: 'RefreshCw', keywords: ['binance', 'bybit', 'okx', 'api', 'connect', 'sync', 'integration', 'platform', 'broker', 'exchange', 'connection', 'link', 'import', 'automated', 'real-time', 'live'] },
        // Phase 2: Trading Accounts - temporarily disabled for backlog #18
        // { title: t('navigation.tradingAccounts'), url: '/accounts', icon: PieChart, iconName: 'PieChart', keywords: ['accounts', 'bank', 'capital', 'balance', 'funds', 'money', 'deposits', 'withdrawals', 'transactions', 'history', 'management', 'initial', 'current', 'wallets', 'manage', 'profiles', 'multiple', 'organize'] },
      ],
    },
    {
      label: t('sidebar.groups.trades'),
      defaultOpen: true,
      dataTour: 'trades-group',
      items: [
        { title: t('trades.addTrade'), url: '/upload', icon: Plus, iconName: 'Plus', keywords: ['upload', 'import', 'add', 'csv', 'file', 'broker', 'manual', 'entry', 'input', 'binance', 'bybit', 'okx', 'data', 'bulk', 'batch', 'new', 'create', 'log', 'record', 'enter'] },
        // Trade Analysis temporarily hidden - incomplete module
        // { title: t('navigation.tradeAnalysis'), url: '/trade-analysis', icon: GitCompare, iconName: 'GitCompare', keywords: ['analysis', 'performance', 'insights', 'metrics', 'statistics', 'win', 'rate', 'profit', 'loss', 'ratio', 'setups', 'patterns', 'timing', 'duration', 'comparison', 'results', 'stats', 'pairs', 'review', 'analyze', 'study', 'examine', 'history'] },
        { title: t('navigation.feeAnalysis'), url: '/fee-analysis', icon: Receipt, iconName: 'Receipt', keywords: ['fees', 'costs', 'expenses', 'charges', 'commission', 'trading', 'costs', 'breakdown', 'efficiency', 'comparison', 'savings', 'optimization', 'red', 'flags', 'commissions', 'funding'] },
        { title: t('navigation.riskManagement'), url: '/risk-management', icon: Shield, iconName: 'Shield', keywords: ['risk', 'protection', 'safety', 'drawdown', 'position', 'size', 'calculator', 'limits', 'stop', 'loss', 'exposure', 'management', 'control', 'mitigation', 'leverage', 'max', 'risk per trade'] },
        { title: t('navigation.tradingJournal'), url: '/journal', icon: BookMarked, iconName: 'BookMarked', keywords: ['journal', 'notes', 'diary', 'log', 'thoughts', 'lessons', 'reflection', 'review', 'write', 'document', 'commentary', 'ideas', 'observations', 'learning'] },
      ],
    },
    {
      label: t('sidebar.groups.analytics'),
      defaultOpen: false,
      dataTour: 'analytics-group',
      items: [
        { title: t('navigation.marketData'), url: '/market-data', icon: LineChart, iconName: 'LineChart', keywords: ['market', 'prices', 'crypto', 'live', 'real-time', 'ticker', 'movers', 'gainers', 'losers', 'volume', '24h', 'change', 'top', 'coins', 'charts', 'data', 'volatility', 'btc', 'eth', 'trends'] },
        { title: t('navigation.forecast'), url: '/forecast', icon: Target, iconName: 'Target', keywords: ['forecast', 'prediction', 'future', 'projection', 'goals', 'targets', 'scenarios', 'simulation', 'planning', 'estimates', 'ai', 'predictions', 'what-if', 'models', 'signals', 'estimate', 'predict'] },
        // Phase 2: Economic Calendar and Performance Alerts - temporarily disabled for backlog #30
        // { title: t('navigation.economicCalendar'), url: '/economic-calendar', icon: Calendar, iconName: 'Calendar', keywords: ['calendar', 'events', 'news', 'macro', 'economy', 'schedule', 'announcements', 'fed', 'inflation', 'cpi', 'fomc', 'rate', 'decisions', 'economic', 'data', 'releases'] },
        // { title: t('navigation.performanceAlerts'), url: '/performance-alerts', icon: Bell, iconName: 'Bell', keywords: ['alerts', 'notifications', 'warnings', 'triggers', 'monitoring', 'notify', 'remind', 'alarm', 'watchlist', 'threshold', 'conditions', 'automated', 'email', 'push'] },
      ],
    },
    {
      label: t('sidebar.groups.planning'),
      defaultOpen: false,
      dataTour: 'planning-group',
      items: [
        { title: t('navigation.tradingPlan'), url: '/trading-plan', icon: ClipboardList, iconName: 'ClipboardList', keywords: ['plan', 'strategy', 'rules', 'checklist', 'discipline', 'guidelines', 'framework', 'methodology', 'approach', 'system', 'process', 'routine', 'setup', 'prepare', 'playbook'] },
        { title: t('navigation.goals'), url: '/goals', icon: Target, iconName: 'Target', keywords: ['goals', 'targets', 'objectives', 'milestones', 'achievements', 'ambitions', 'progress', 'tracking', 'completion', 'roadmap', 'plans', 'aim', 'ambition', 'success', 'kpi'] },
        { title: t('navigation.psychology'), url: '/psychology', icon: Brain, iconName: 'Brain', keywords: ['psychology', 'emotions', 'mental', 'mindset', 'behavior', 'feelings', 'emotional', 'state', 'mood', 'trader', 'discipline', 'confidence', 'fear', 'greed', 'patience', 'stress', 'anxiety', 'timeline', 'log', 'patterns', 'analysis', 'bias', 'thinking', 'cognition', 'calm', 'mind', 'mental health', 'wellbeing', 'self-awareness'] },
      ],
    },
    {
      label: t('sidebar.groups.reports'),
      defaultOpen: false,
      dataTour: 'reports-group',
      items: [
        // { title: t('navigation.reports'), url: '/reports', icon: FileBarChart, iconName: 'FileBarChart', keywords: ['reports', 'documents', 'generate', 'export', 'monthly', 'weekly', 'custom', 'scheduled', 'automated', 'history', 'download', 'summary', 'kpi', 'metrics', 'analysis', 'period', 'excel', 'csv'] },
        { title: t('navigation.taxReports'), url: '/tax-reports', icon: FileText, iconName: 'FileText', keywords: ['tax', 'taxes', 'irs', 'filings', 'legal', 'compliance', 'capital', 'gains', 'losses', 'year', 'end', 'accountant', 'documentation', 'fifo', 'lifo', 'accounting', 'fiscal', 'revenue', 'income'] },
      ],
    },
    {
      label: t('sidebar.groups.community'),
      defaultOpen: false,
      dataTour: 'community-group',
      items: [
        // Phase 2: Social features - temporarily disabled for backlog #34
        // { title: t('navigation.social'), url: '/social', icon: Users, iconName: 'Users', keywords: ['social', 'community', 'feed', 'posts', 'share', 'friends', 'network', 'follow', 'followers', 'strategies', 'discussions', 'comments', 'likes', 'engagement', 'traders', 'public'] },
        // { title: 'Social Feed', url: '/social-feed', icon: Heart, iconName: 'Heart', keywords: ['feed', 'posts', 'community', 'share', 'social', 'network', 'connect', 'trading', 'ideas', 'discuss'] },
        // { title: t('navigation.leaderboard'), url: '/leaderboard', icon: Trophy, iconName: 'Trophy', keywords: ['leaderboard', 'ranking', 'top', 'competition', 'scores', 'traders', 'best', 'performers', 'elite', 'standings', 'positions', 'compare', 'leaders', 'winners', 'rank', 'compete'] },
        { title: t('navigation.achievements'), url: '/achievements', icon: Award, iconName: 'Award', keywords: ['achievements', 'badges', 'rewards', 'unlocks', 'milestones', 'trophies', 'accomplishments', 'goals', 'completed', 'earned', 'collection', 'showcase', 'awards', 'earn', 'win', 'accomplish'] },
        { title: t('navigation.progressXP'), url: '/gamification', icon: Zap, iconName: 'Zap', keywords: ['progress', 'xp', 'experience', 'level', 'achievements', 'gamification', 'points', 'rewards', 'streaks', 'challenges', 'daily', 'weekly', 'missions', 'unlock', 'growth', 'rank', 'leveling'] },
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

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedGroups([]);
      setAllExpanded(false);
    } else {
      const allLabels = menuStructure.map(g => g.label);
      setExpandedGroups(allLabels);
      setAllExpanded(true);
    }
  };

  const isGroupExpanded = (label: string) => {
    if (searchQuery !== '') return true; // Keep all expanded during search
    return expandedGroups.includes(label);
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  };

  return (
    <Sidebar collapsible="icon" className="sticky top-0 h-screen border-r border-border/50 backdrop-blur-xl bg-background/95 shadow-lg z-40">
      <div className="p-4 border-b border-border/50 flex items-center justify-center">
        <Logo size={open ? "md" : "sm"} variant={open ? "horizontal" : "icon"} showText={open} />
      </div>

      <SidebarContent className="gap-0.5">
        {/* Search and Controls */}
        {open && (
          <div className="px-3 py-1.5 space-y-1.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('sidebar.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          {/* Toggle Expand/Collapse */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpandAll}
              className="w-full h-7 text-xs"
            >
              {allExpanded ? t('sidebar.collapseAll') : t('sidebar.expandAll')}
            </Button>
          </div>
        )}

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <Collapsible defaultOpen={true}>
            <SidebarGroup>
              <CollapsibleTrigger className="w-full">
                <SidebarGroupLabel className="text-primary flex items-center justify-between group-data-[state=open]/collapsible:text-primary">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-primary" />
                    {t('sidebar.favorites')} ({favorites.length}/12)
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarGroupLabel>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {favorites.map((fav) => (
                      <SidebarMenuItem key={fav.page_url}>
                        <div className="flex items-center group/fav w-full">
                          <SidebarMenuButton asChild tooltip={fav.page_title} className="flex-1">
                            <NavLink 
                              to={fav.page_url} 
                              end 
                              className={getNavCls}
                            >
                              <Star className="h-4 w-4 fill-primary text-primary" />
                              {open && <span>{fav.page_title}</span>}
                            </NavLink>
                          </SidebarMenuButton>
                          
                          {open && (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 opacity-0 group-hover/fav:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      toggleFavorite(fav.page_url, fav.page_title, 'Star');
                                    }}
                                  >
                                    <Star className="h-4 w-4 fill-primary text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  {t('sidebar.removeFromFavorites')}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        )}

        {/* Main Menu Groups */}
        {filteredMenuStructure.map((group) => (
          <Collapsible 
            key={group.label} 
            open={isGroupExpanded(group.label)}
            onOpenChange={() => toggleGroup(group.label)}
            className="group/collapsible"
          >
            <SidebarGroup data-tour={group.dataTour}>
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
                      const itemIsFavorite = isFavorite(item.url);
                      
                        return (
                        <SidebarMenuItem key={item.title}>
                          <div 
                            className="flex items-center group/item w-full"
                            {...(item.url === '/market-data' ? { 'data-tour': 'market-data' } : 
                                item.url === '/trade-analysis' ? { 'data-tour': 'analytics-section' } :
                                item.url === '/social' ? { 'data-tour': 'social-section' } : {})}
                          >
                            <SidebarMenuButton asChild tooltip={item.title} className="flex-1">
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
                            
                            {open && (
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={cn(
                                        "h-8 w-8 opacity-0 group-hover/item:opacity-100 transition-opacity",
                                        itemIsFavorite && "opacity-100"
                                      )}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleFavorite(item.url, item.title, item.iconName || 'Star');
                                      }}
                                      aria-pressed={itemIsFavorite}
                                    >
                                      <Heart 
                                        className={cn(
                                          "h-4 w-4 transition-all",
                                          itemIsFavorite 
                                            ? "fill-primary text-primary" 
                                            : "text-muted-foreground hover:text-primary"
                                        )}
                                      />
                                    </Button>
                                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {itemIsFavorite ? t('sidebar.removeFromFavorites') : t('sidebar.addToFavorites')}
                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
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
                    {t('sidebar.archived')} ({archivedMenu.length})
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
                          {t('sidebar.restore', { group: group.label })}
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
              <SidebarMenuItem data-tour="user-guide">
                <SidebarMenuButton asChild tooltip={t('navigation.userGuide')}>
                  <NavLink to="/user-guide" end className={getNavCls}>
                    <BookOpen className="h-4 w-4" />
                    {open && <span>{t('navigation.userGuide')}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Accessibility">
                  <NavLink to="/accessibility" end className={getNavCls}>
                    <Accessibility className="h-4 w-4" />
                    {open && <span>Accessibility</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
