import { useLocation, Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, TrendingUp, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  const quickLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Blog", href: "/blog", icon: BookOpen },
    { label: "Analytics", href: "/analytics", icon: TrendingUp },
  ];

  return (
    <>
      <SEO
        title="404 — Page Not Found | The Trading Diary"
        description="The page you are looking for does not exist. Return to your trading dashboard or explore The Trading Diary."
        noindex={true}
      />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        {/* Big number */}
        <div className="mb-6 text-[10rem] font-black leading-none tracking-tight bg-gradient-to-br from-primary via-primary/70 to-primary/30 bg-clip-text text-transparent select-none">
          404
        </div>

        {/* Message */}
        <h1 className="mb-2 text-2xl font-bold text-center">Page not found</h1>
        <p className="mb-8 text-muted-foreground text-center max-w-sm leading-relaxed">
          The page <span className="font-mono text-sm text-foreground/60 bg-muted px-1.5 py-0.5 rounded">{location.pathname}</span> doesn't exist or was moved.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row gap-3 mb-12">
          <Link to="/">
            <Button size="lg" className="gap-2 font-semibold">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Open Dashboard
            </Button>
          </Link>
        </div>

        {/* Quick links */}
        <div className="border-t border-border/50 pt-8 w-full max-w-sm">
          <p className="text-xs text-muted-foreground text-center uppercase tracking-wider mb-4 font-medium">
            Or jump to
          </p>
          <div className="flex justify-center gap-6">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
