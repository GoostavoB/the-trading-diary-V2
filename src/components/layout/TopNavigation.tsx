import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    BarChart3, Plus, Receipt, Shield,
    LineChart, Target,
    Menu, X, Link2, History as HistoryIcon,
    GraduationCap, Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MarketTicker } from './MarketTicker';
   import { Logo } from '@/components/Logo';
import { UserAccountMenu } from './UserAccountMenu';
import { ThemeStudio } from '@/components/theme-studio/ThemeStudio';
import { CurrencySelector } from '@/components/CurrencySelector';
import { BlurToggle } from '@/components/BlurToggle';
import { MobileNav } from '@/components/mobile/MobileNav';
import { MonthlyGoalNavBadge } from './MonthlyGoalNavBadge';
import { useFavorites } from '@/hooks/useFavorites';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TopNavigation() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);

    // Account-level favorites (Supabase `user_favorites`) — same source as the
    // existing "Add Trade" / "Dashboard" pins, so they sync across devices.
    const { isFavorite, toggleFavorite, favorites } = useFavorites();

    const isActive = (path: string) => location.pathname === path;

    const menuItems = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: BarChart3
        },
        {
            title: 'Academy',
            url: '/learn',
            icon: GraduationCap
        },
        {
            title: 'Trades',
            items: [
                { title: 'Fee Analysis', url: '/fee-analysis', icon: Receipt, description: 'Analyze trading costs and commissions' },
                { title: 'Risk Management', url: '/risk-management', icon: Shield, description: 'Position sizing and risk calculators' },
                { title: 'Exchange Connections', url: '/exchanges', icon: Link2, description: 'Connect exchanges for automatic trade sync' },
            ]
        },
        {
            title: 'Analytics',
            items: [
                { title: 'Forecast', url: '/forecast', icon: Target, description: 'Project future growth scenarios' },
                { title: 'Market Data', url: '/market-data', icon: LineChart, description: 'Real-time prices, long/short ratio and open interest' },
                { title: 'LSR & OI Grid', url: '/lsr-oi-grid', icon: BarChart3, description: 'Multi-asset long/short ratio and open interest grid' },
            ]
        },
        {
            title: 'Planning',
            items: [
                { title: 'Goals', url: '/goals', icon: Target, description: 'Set and track trading objectives' },
                { title: 'Capital Management', url: '/capital-management', icon: Plus, description: 'Log capital additions and track growth' },
            ]
        },
        {
            title: 'History',
            url: '/dashboard?tab=history',
            icon: HistoryIcon
        },
    ];

    const flatItems = useMemo(
        () =>
            menuItems.flatMap((item) =>
                item.url
                    ? [{ title: item.title, url: item.url, icon: item.icon }]
                    : (item.items ?? []).map((sub) => ({ title: sub.title, url: sub.url, icon: sub.icon }))
            ),
        []
    );

    // Icon names persisted alongside each favorite (page_icon column).
    const ICON_NAMES: Record<string, string> = {
        '/dashboard': 'BarChart3',
        '/learn': 'GraduationCap',
        '/fee-analysis': 'Receipt',
        '/risk-management': 'Shield',
        '/exchanges': 'Link2',
        '/forecast': 'Target',
        '/market-data': 'LineChart',
        '/lsr-oi-grid': 'BarChart3',
        '/goals': 'Target',
        '/capital-management': 'Plus',
        '/dashboard?tab=history': 'History',
    };

    // Pinned bar: every account favorite, using the nav icon when we know the route.
    const favoriteItems = favorites.map((fav) => {
        const match = flatItems.find((item) => item.url === fav.page_url);
        return {
            url: fav.page_url,
            title: match?.title ?? fav.page_title,
            icon: match?.icon ?? Star,
        };
    });

    // Rendered as a SIBLING of the NavLink (never nested inside the <a>):
    // a <button> inside an <a> is invalid HTML and gets dropped from the a11y tree.
    const FavoriteStar = ({ url, title }: { url: string; title: string }) => (
        <button
            type="button"
            onClick={() => toggleFavorite(url, title, ICON_NAMES[url] ?? 'Star')}
            title={isFavorite(url) ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            aria-label={isFavorite(url) ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            aria-pressed={isFavorite(url)}
            className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-primary"
        >
            <Star className={cn('h-4 w-4', isFavorite(url) && 'fill-primary text-primary')} />
        </button>
    );

    const NavRow = ({
        url,
        title,
        icon: Icon,
        onNavigate,
    }: {
        url: string;
        title: string;
        icon: React.ComponentType<{ className?: string }>;
        onNavigate: () => void;
    }) => (
        <div className="flex items-center gap-1">
            <NavLink
                to={url}
                onClick={onNavigate}
                className={cn(
                    'flex flex-1 items-center gap-3 py-2 px-3 rounded-lg transition-colors',
                    isActive(url) ? 'bg-primary/10 text-primary' : 'hover:bg-white/5 text-foreground'
                )}
            >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{title}</span>
            </NavLink>
            <FavoriteStar url={url} title={title} />
        </div>
    );

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
                {/* Hamburger + Logo */}
            <div className="flex items-center gap-3">
            <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
                aria-label="Toggle navigation menu"
                >
            <Menu className="h-5 w-5" />
            </Button>
            <NavLink
                to="/dashboard"
                className="rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label="The Trading Diary — go to Dashboard"
                >
            <Logo size="sm" variant="horizontal" showText={true} />
            </NavLink>
            </div>
            
                {/* Market Ticker */}
            <div className="hidden lg:flex flex-1 items-center justify-center px-6">
            <MarketTicker />
            </div>
            


                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Monthly goal — compact tier badge, hidden until a goal is set */}
                    <MonthlyGoalNavBadge />

                    {/* Pinned favorites — quick access without opening the side menu */}
                    {favoriteItems.length > 0 && (
                        <TooltipProvider delayDuration={200}>
                            <div className="hidden lg:flex items-center gap-1">
                                {favoriteItems.map((item) => (
                                    <Tooltip key={item.url}>
                                        <TooltipTrigger asChild>
                                            <NavLink
                                                to={item.url}
                                                className={cn(
                                                    'flex h-9 items-center gap-1.5 rounded-lg border border-border/40 px-2.5 text-xs font-medium transition-colors',
                                                    isActive(item.url)
                                                        ? 'bg-primary/10 text-primary border-primary/40'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                                )}
                                            >
                                                <item.icon className="h-4 w-4" />
                                                <span className="hidden xl:inline">{item.title}</span>
                                            </NavLink>
                                        </TooltipTrigger>
                                        <TooltipContent>{item.title}</TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </TooltipProvider>
                    )}
                    {/* Add Trade — primary CTA, always distinct from tabs (iOS blue gradient, white text) */}
                    <NavLink to="/upload" className="hidden sm:block">
                        <Button
                            size="sm"
                            className="gap-1.5 font-semibold !bg-primary !text-primary-foreground hover:!bg-primary/90 shadow-[0_4px_14px_hsl(var(--primary)/0.35)] border border-primary/60"
                        >
                            <Plus className="h-4 w-4" />
                            Add Trade
                        </Button>
                    </NavLink>
                    <div className="hidden md:flex items-center gap-2">
                        <CurrencySelector />
                        <BlurToggle />
                        <ThemeStudio />
                    </div>
                    <UserAccountMenu />

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

        {/* Desktop Nav Dropdown Panel */}
    {isNavMenuOpen && (
        <div className="hidden md:block absolute left-4 top-16 z-50 w-80 rounded-xl border border-border/40 bg-background/95 backdrop-blur-xl p-4 shadow-xl space-y-4">
            {menuItems.map((item) => (
            <div key={item.title} className="space-y-2">
                {item.url ? (
                <NavRow url={item.url} title={item.title} icon={item.icon} onNavigate={() => setIsNavMenuOpen(false)} />
                ) : (
                <>
                <h4 className="text-xs font-semibold text-muted-foreground px-3">{item.title}</h4>
                <div className="grid grid-cols-1 gap-1">
                    {item.items?.map((subItem) => (
                    <NavRow
                        key={subItem.title}
                        url={subItem.url}
                        title={subItem.title}
                        icon={subItem.icon}
                        onNavigate={() => setIsNavMenuOpen(false)}
                    />
                    ))}
                </div>
                </>
                )}
            </div>
            ))}
        </div>
        )}
    
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl p-4 space-y-4 absolute w-full left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    {menuItems.map((item) => (
                        <div key={item.title} className="space-y-2">
                            {item.url ? (
                                <NavRow url={item.url} title={item.title} icon={item.icon} onNavigate={() => setIsMobileMenuOpen(false)} />
                            ) : (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        {item.title}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2 pl-2">
                                        {item.items?.map((subItem) => (
                                            <NavRow
                                                key={subItem.title}
                                                url={subItem.url}
                                                title={subItem.title}
                                                icon={subItem.icon}
                                                onNavigate={() => setIsMobileMenuOpen(false)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div className="pt-4 border-t border-border/10 flex gap-2">
                        <CurrencySelector />
                        <BlurToggle />
                        <ThemeStudio />
                    </div>
                </div>
            )}
        </header>
    );
}
