import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeStudio } from "@/components/theme-studio/ThemeStudio";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate, useLocation } from "react-router-dom";

export const MobileHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Define public routes where Theme Studio should be hidden
  const publicRoutes = [
    '/', '/pricing', '/contact', '/legal', '/terms', '/privacy',
    '/blog', '/about', '/testimonials', '/how-it-works', '/features',
    '/changelog', '/cookie-policy', '/sitemap', '/logo-download',
    '/logo-generator', '/crypto-trading-faq', '/seo-dashboard', '/author'
  ];

  const isPublicRoute = publicRoutes.some(route =>
    location.pathname === route ||
    location.pathname.startsWith('/blog/') ||
    location.pathname.startsWith('/author/')
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo - Left */}
        <div className="flex items-center">
          <Logo variant="horizontal" size="sm" showText={true} />
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <nav className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/blog')}
            className="h-11 px-4"
          >
            Blog
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/pricing')}
            className="h-11 px-4"
          >
            Pricing
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/contact')}
            className="h-11 px-4"
          >
            Contact
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
            className="h-11 px-4"
          >
            Sign In
          </Button>
          {!isPublicRoute && <ThemeStudio />}
        </nav>

        {/* Mobile Menu - Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[280px] sm:w-[320px] glass-strong"
            >
              <nav className="flex flex-col gap-6 mt-8">
                <Button
                  variant="default"
                  onClick={() => navigate('/auth')}
                  className="h-12 w-full justify-start text-base"
                >
                  Sign In
                </Button>

                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/blog')}
                    className="h-12 w-full justify-start text-base"
                  >
                    Blog
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/pricing')}
                    className="h-12 w-full justify-start text-base"
                  >
                    Pricing
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/contact')}
                    className="h-12 w-full justify-start text-base"
                  >
                    Contact
                  </Button>
                </div>

                {!isPublicRoute && (
                  <div className="pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Theme</span>
                      <ThemeStudio />
                    </div>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
