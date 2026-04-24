import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    BarChart3, Wallet, Plus, Receipt, Shield, BookMarked,
    LineChart, Target, Brain, AlertCircle, TrendingDown,
    FileText, BookOpen, ChevronDown, Menu, X
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
                { title: 'Journal', url: '/journal', icon: BookMarked, description: 'Review your trading diary and notes' },
                { title: 'Risk Management', url: '/risk-management', icon: Shield, description: 'Position sizing and risk calculators' },
                { title: 'Fee Analysis', url: '/fee-analysis', icon: Receipt, description: 'Analyze trading costs and commissions' },
                { title: 'Tax Reports', url: '/tax-reports', icon: FileText, description: 'Generate tax reports for your trades' },
                { title: 'Reports', url: '/reports', icon: BarChart3, description: 'AI-generated performance reports' },
            ]
        },
        {
            title: 'Analytics',
            items: [
                { title: 'Advanced Analytics', url: '/analytics', icon: BarChart3, description: 'Deep dive into performance metrics' },
                { title: 'Market Data', url: '/market-data', icon: LineChart, description: 'Real-time crypto prices and movers' },
                { title: 'Forecast', url: '/forecast', icon: Target, description: 'Project future growth scenarios' },
                { title: 'Error Analytics', url: '/error-analytics', icon: AlertCircle, description: 'Identify and reduce costly mistakes' },
                { title: 'Long/Short Ratio', url: '/long-short-ratio', icon: TrendingDown, description: 'Market sentiment via long/short data' },
            ]
        },
        {
            title: 'Planning',
            items: [
                { title: 'Goals', url: '/goals', icon: Target, description: 'Set and track trading objectives' },
                { title: 'Trading Plan', url: '/trading-plan', icon: BookOpen, description: 'Create and follow your trading strategy' },
                { title: 'Psychology', url: '/psychology', icon: Brain, description: 'Track emotional state and discipline' },
                { title: 'Spot Wallet', url: '/spot-wallet', icon: Wallet, description: 'Track your crypto assets and net worth' },
                { title: 'Capital Management', url: '/capital-management', icon: Plus, description: 'Log capital additions and track growth' },
            ]
        },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="w-full flex h-16 items-center justify-between px-4 md:px-6">
                {/* Logo */}
                <div className="flex items-center gap-6">
                    <Logo size="sm" variant="horizontal" showText={true} />

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex">
                        <NavigationMenu>
                            <NavigationMenuList>
                                {menuItems.map((item) => (
                                    <NavigationMenuItem key={item.title}>
                                        {item.url ? (
                                            <NavLink to={item.url} className={navigationMenuTriggerStyle()}>
                                                {item.title}
                                            </NavLink>
                                        ) : (
                                            <>
                                                <NavigationMenuTrigger className="bg-transparent hover:bg-white/5 data-[state=open]:bg-white/5">
                                                    {item.title}
                                                </NavigationMenuTrigger>
                                                <NavigationMenuContent>
                                                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-card/95 backdrop-blur-xl border border-border/10">
                                                        {item.items?.map((subItem) => (
                                                            <li key={subItem.title}>
                                                                <NavigationMenuLink asChild>
                                                                    <NavLink
                                                                        to={subItem.url}
                                                                        className={cn(
                                                                            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground",
                                                                            isActive(subItem.url) && "bg-accent/10 text-primary"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2 text-sm font-medium leading-none">
                                                                            <subItem.icon className="h-4 w-4 text-primary" />
                                                                            {subItem.title}
                                                                        </div>
                                                                        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground mt-1.5">
                                                                            {subItem.description}
                                                                        </p>
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
                    {/* Add Trade — primary CTA always visible */}
                    <NavLink to="/upload" className="hidden sm:block">
                        <Button size="sm" className="gap-1.5 font-semibold">
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
