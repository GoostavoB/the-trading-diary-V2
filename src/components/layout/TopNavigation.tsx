import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    BarChart3, Plus, Receipt, Shield,
    LineChart, Target,
    Menu, X, Link2, History as HistoryIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Logo } from '@/components/Logo';
import { UserAccountMenu } from './UserAccountMenu';
import { ThemeStudio } from '@/components/theme-studio/ThemeStudio';
import { CurrencySelector } from '@/components/CurrencySelector';
import { BlurToggle } from '@/components/BlurToggle';
import { MobileNav } from '@/components/mobile/MobileNav';

export function TopNavigation() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const menuItems = [
        {
            title: 'Dashboard',
            url: '/dashboard',
            icon: BarChart3
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

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo — clicks return to Dashboard (default tab) */}
                <div className="flex items-center gap-6">
                    <NavLink
                        to="/dashboard"
                        className="rounded-md transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        aria-label="The Trading Diary — go to Dashboard"
                    >
                        <Logo size="sm" variant="horizontal" showText={true} />
                    </NavLink>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex">
                        <NavigationMenu>
                            <NavigationMenuList>
                                {menuItems.map((item) => (
                                    <NavigationMenuItem key={item.title}>
                                        {item.url ? (
                                            <NavLink
                                                to={item.url}
                                                className={cn(
                                                    // Base: transparent bg, iOS-style text, tight hit area
                                                    "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                                    // Active: subtle primary tint, clearly readable (AA contrast)
                                                    isActive(item.url.split('?')[0])
                                                        ? "bg-primary/15 text-primary ring-1 ring-primary/25"
                                                        : "bg-transparent text-foreground/80 hover:bg-white/5 hover:text-foreground"
                                                )}
                                            >
                                                {item.title}
                                            </NavLink>
                                        ) : (
                                            <>
                                                <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:bg-white/5 hover:text-foreground data-[state=open]:bg-white/5 data-[state=open]:text-foreground focus:bg-white/5 transition-colors duration-150">
                                                    {item.title}
                                                </NavigationMenuTrigger>
                                                <NavigationMenuContent>
                                                    <ul className="grid w-[420px] gap-1 p-3 md:w-[520px] md:grid-cols-2 bg-card/98 backdrop-blur-2xl border border-border/20 shadow-2xl rounded-xl">
                                                        {item.items?.map((subItem) => (
                                                            <li key={subItem.title}>
                                                                <NavigationMenuLink asChild>
                                                                    <NavLink
                                                                        to={subItem.url}
                                                                        className={cn(
                                                                            "flex items-start gap-3 select-none rounded-lg p-3 leading-none no-underline outline-none transition-all duration-150 hover:bg-white/5 focus:bg-white/5 group",
                                                                            isActive(subItem.url) && "bg-primary/[0.08] border border-primary/15"
                                                                        )}
                                                                    >
                                                                        <div className={cn(
                                                                            "mt-0.5 p-1.5 rounded-md shrink-0 transition-colors duration-150",
                                                                            isActive(subItem.url) ? "bg-primary/15" : "bg-white/5 group-hover:bg-primary/10"
                                                                        )}>
                                                                            <subItem.icon className={cn("h-3.5 w-3.5", isActive(subItem.url) ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className={cn("text-sm font-medium leading-none mb-1", isActive(subItem.url) ? "text-primary" : "text-foreground")}>
                                                                                {subItem.title}
                                                                            </div>
                                                                            <p className="text-xs leading-snug text-muted-foreground line-clamp-1">
                                                                                {subItem.description}
                                                                            </p>
                                                                        </div>
                                                                    </NavLink>
                                                                </NavigationMenuLink>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </NavigationMenuContent>
                                            </>
                                        )}
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4">
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

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl p-4 space-y-4 absolute w-full left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto">
                    {menuItems.map((item) => (
                        <div key={item.title} className="space-y-2">
                            {item.url ? (
                                <NavLink
                                    to={item.url}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "block py-2 text-lg font-medium",
                                        isActive(item.url) ? "text-primary" : "text-foreground"
                                    )}
                                >
                                    {item.title}
                                </NavLink>
                            ) : (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                        {item.title}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2 pl-2">
                                        {item.items?.map((subItem) => (
                                            <NavLink
                                                key={subItem.title}
                                                to={subItem.url}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={cn(
                                                    "flex items-center gap-3 py-2 px-3 rounded-lg transition-colors",
                                                    isActive(subItem.url)
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-white/5 text-foreground"
                                                )}
                                            >
                                                <subItem.icon className="h-4 w-4" />
                                                <span className="text-sm font-medium">{subItem.title}</span>
                                            </NavLink>
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
