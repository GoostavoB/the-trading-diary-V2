import { Link, useLocation } from "react-router-dom";
import { Home, TrendingUp, History as HistoryIcon, LineChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export const MobileNav = () => {
  const location = useLocation();
  const { t } = useTranslation();

  // Matches the simplified top-nav: Dashboard, Trades (entry), Analytics (Market Data), History, Settings
  const navItems = [
    { path: "/dashboard", icon: Home, label: t('navigation.home') },
    { path: "/upload", icon: TrendingUp, label: t('trades.trade') },
    { path: "/market-data", icon: LineChart, label: "Market" },
    { path: "/dashboard?tab=history", icon: HistoryIcon, label: "History" },
    { path: "/settings", icon: Settings, label: t('common.settings') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 md:hidden safe-area-bottom">
      <nav className="flex justify-around items-center h-16 px-2 pb-safe">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors min-w-[48px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
