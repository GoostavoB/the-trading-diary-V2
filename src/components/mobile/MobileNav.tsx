import { Link, useLocation } from "react-router-dom";
import { Home, TrendingUp, Users, Settings, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Home" },
    { path: "/tools", icon: BarChart3, label: "Tools" },
    { path: "/upload", icon: TrendingUp, label: "Trade" },
    { path: "/social", icon: Users, label: "Social" },
    { path: "/settings", icon: Settings, label: "More" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-border/50 md:hidden">
      <nav className="flex justify-around items-center h-16 px-2">
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
