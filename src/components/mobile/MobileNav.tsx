import { Link, useLocation } from "react-router-dom";
import { Home, TrendingUp, Users, Settings, BarChart3, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export const MobileNav = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: t('navigation.home') },
    { path: "/tools", icon: BarChart3, label: t('navigation.tools') },
    { path: "/upload", icon: TrendingUp, label: t('trades.trade') },
    { path: "/logo-generator", icon: Image, label: "Logos" },
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
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
