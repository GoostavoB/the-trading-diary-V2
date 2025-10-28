import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AccountProvider } from "@/contexts/AccountContext";
import { AIAssistantProvider } from "@/contexts/AIAssistantContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { BlurProvider } from "@/contexts/BlurContext";
import { CalmModeProvider } from "@/contexts/CalmModeContext";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import i18n from "@/i18n";
import { GlobalSearch } from "@/components/GlobalSearch";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { PublicPageThemeWrapper } from "@/components/PublicPageThemeWrapper";
import { usePageTracking } from "@/hooks/usePageTracking";
import { ConversionTracking } from "@/components/ConversionTracking";
import { LanguageSync } from "@/components/LanguageSync";

// Eagerly load critical pages (landing and auth)
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Lazy load all other pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Upload = lazy(() => import("./pages/Upload"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Forecast = lazy(() => import("./pages/Forecast"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Gamification = lazy(() => import("./pages/Gamification"));
const MarketData = lazy(() => import("./pages/MarketData"));
const Settings = lazy(() => import("./pages/Settings"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Author = lazy(() => import("./pages/Author"));
const FAQ = lazy(() => import("./pages/FAQ"));
const CryptoTradingFAQ = lazy(() => import("./pages/CryptoTradingFAQ"));
// Phase 2: Social features - temporarily disabled for backlog #34
// const Social = lazy(() => import("./pages/Social"));
const AITools = lazy(() => import("./pages/AITools"));
const Journal = lazy(() => import("./pages/Journal"));
const TradeAnalysis = lazy(() => import("./pages/TradeAnalysis"));
const Goals = lazy(() => import("./pages/Goals"));
const RiskManagement = lazy(() => import("./pages/RiskManagement"));
const Reports = lazy(() => import("./pages/Reports"));
const Psychology = lazy(() => import("./pages/Psychology"));
const TradingPlan = lazy(() => import("./pages/TradingPlan"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CustomPage = lazy(() => import("./pages/CustomPage"));
const SpotWallet = lazy(() => import("./pages/SpotWallet"));
const TrackCapital = lazy(() => import("./pages/TrackCapital"));
const FeeAnalysis = lazy(() => import("./pages/FeeAnalysis"));
const LogoDownload = lazy(() => import("./pages/LogoDownload"));
const LogoGenerator = lazy(() => import("./pages/LogoGenerator"));
const Calculators = lazy(() => import("./pages/Calculators"));
// Phase 2: Leaderboard feature - temporarily disabled for backlog #34
// const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const FriendLeaderboard = lazy(() => import("./pages/FriendLeaderboard"));
const LongShortRatio = lazy(() => import("./pages/LongShortRatio"));
const EconomicCalendar = lazy(() => import("./pages/EconomicCalendar"));
const TaxReports = lazy(() => import("./pages/TaxReports"));
const Withdrawals = lazy(() => import("./pages/Withdrawals"));
// Phase 2: Trading Accounts module - temporarily disabled for backlog #18 (incomplete form)
// const Accounts = lazy(() => import("./pages/Accounts"));
const PerformanceAlerts = lazy(() => import("./pages/PerformanceAlerts"));
// Phase 2: Progress Analytics (IXP/XP) - temporarily disabled for backlog #36 (visual redesign pending)
// const ProgressAnalytics = lazy(() => import("./pages/ProgressAnalytics"));
const MyMetrics = lazy(() => import("./pages/MyMetrics"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const AccessibilityGuide = lazy(() => import("./pages/AccessibilityGuide"));
const Contact = lazy(() => import("./pages/Contact"));
const Support = lazy(() => import("./pages/Support"));
const Legal = lazy(() => import("./pages/Legal"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const About = lazy(() => import("./pages/About"));
const SEODashboard = lazy(() => import("./pages/SEODashboard"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Learn = lazy(() => import("./pages/Learn"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const AdvancedAnalytics = lazy(() => import("./pages/AdvancedAnalytics"));
// Phase 2: Social Feed - temporarily disabled for backlog #34
// const SocialFeed = lazy(() => import("./pages/SocialFeed"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const ChangelogPage = lazy(() => import("./pages/ChangelogPage"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const FeaturesPage = lazy(() => import("./pages/FeaturesPage"));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Card className="p-8 glass-strong">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </Card>
  </div>
);

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  usePageTracking(); // Automatically track page views
  
  return (
    <>
      <LanguageSync />
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Landing page (English only) */}
        <Route path="/" element={<PublicPageThemeWrapper><Index /></PublicPageThemeWrapper>} />
        
        {/* Redirect all language-prefixed routes to English */}
        <Route path="/vi" element={<Navigate to="/" replace />} />
        <Route path="/vi/*" element={<Navigate to="/" replace />} />
        <Route path="/pt" element={<Navigate to="/" replace />} />
        <Route path="/pt/*" element={<Navigate to="/" replace />} />
        <Route path="/es" element={<Navigate to="/" replace />} />
        <Route path="/es/*" element={<Navigate to="/" replace />} />
        <Route path="/ar" element={<Navigate to="/" replace />} />
        <Route path="/ar/*" element={<Navigate to="/" replace />} />
        
        {/* Auth routes - wrapped with default theme */}
        <Route path="/auth" element={<PublicPageThemeWrapper><Auth /></PublicPageThemeWrapper>} />
        
        {/* Public pages - wrapped with default theme */}
        <Route path="/pricing" element={<PublicPageThemeWrapper><PricingPage /></PublicPageThemeWrapper>} />
        
        <Route path="/contact" element={<PublicPageThemeWrapper><Contact /></PublicPageThemeWrapper>} />
        
        <Route path="/legal" element={<PublicPageThemeWrapper><Legal /></PublicPageThemeWrapper>} />
        
        <Route path="/terms" element={<PublicPageThemeWrapper><Terms /></PublicPageThemeWrapper>} />
        
        <Route path="/privacy" element={<PublicPageThemeWrapper><Privacy /></PublicPageThemeWrapper>} />
        
        {/* Blog routes - wrapped with default theme */}
        <Route path="/blog" element={<PublicPageThemeWrapper><Blog /></PublicPageThemeWrapper>} />
        <Route path="/blog/:slug" element={<PublicPageThemeWrapper><BlogPost /></PublicPageThemeWrapper>} />
        <Route path="/author/:authorSlug" element={<PublicPageThemeWrapper><Author /></PublicPageThemeWrapper>} />
        
        {/* Other public pages - wrapped with default theme */}
        <Route path="/logo-download" element={<PublicPageThemeWrapper><LogoDownload /></PublicPageThemeWrapper>} />
        <Route path="/logo-generator" element={<PublicPageThemeWrapper><LogoGenerator /></PublicPageThemeWrapper>} />
        <Route path="/calculators" element={<ProtectedRoute><Calculators /></ProtectedRoute>} />
        <Route path="/crypto-trading-faq" element={<PublicPageThemeWrapper><CryptoTradingFAQ /></PublicPageThemeWrapper>} />
        <Route path="/sitemap" element={<PublicPageThemeWrapper><Sitemap /></PublicPageThemeWrapper>} />
        <Route path="/about" element={<PublicPageThemeWrapper><About /></PublicPageThemeWrapper>} />
        <Route path="/seo-dashboard" element={<PublicPageThemeWrapper><SEODashboard /></PublicPageThemeWrapper>} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
        <Route path="/market-data" element={<ProtectedRoute><MarketData /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        {/* Phase 2: Social features - temporarily disabled for backlog #34 */}
        {/* <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} /> */}
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        {/* Trade Analysis temporarily disabled - incomplete module */}
        {/* <Route path="/trade-analysis" element={<ProtectedRoute><TradeAnalysis /></ProtectedRoute>} /> */}
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/risk-management" element={<ProtectedRoute><RiskManagement /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/psychology" element={<ProtectedRoute><Psychology /></ProtectedRoute>} />
        <Route path="/trading-plan" element={<ProtectedRoute><TradingPlan /></ProtectedRoute>} />
        {/* Exchange connections temporarily hidden for future use */}
        {/* <Route path="/exchanges" element={<ProtectedRoute><ExchangeConnections /></ProtectedRoute>} /> */}
        <Route path="/spot-wallet" element={<ProtectedRoute><SpotWallet /></ProtectedRoute>} />
        <Route path="/track-capital" element={<ProtectedRoute><TrackCapital /></ProtectedRoute>} />
        <Route path="/fee-analysis" element={<ProtectedRoute><FeeAnalysis /></ProtectedRoute>} />
        <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
        {/* Phase 2: Leaderboard - temporarily disabled for backlog #34 */}
        {/* <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} /> */}
        <Route path="/friend-leaderboard" element={<ProtectedRoute><FriendLeaderboard /></ProtectedRoute>} />
        <Route path="/long-short-ratio" element={<ProtectedRoute><LongShortRatio /></ProtectedRoute>} />
        {/* Phase 2: Economic Calendar and Performance Alerts - temporarily disabled for backlog #30 */}
        {/* <Route path="/economic-calendar" element={<ProtectedRoute><EconomicCalendar /></ProtectedRoute>} /> */}
        <Route path="/tax-reports" element={<ProtectedRoute><TaxReports /></ProtectedRoute>} />
        <Route path="/withdrawals" element={<ProtectedRoute><Withdrawals /></ProtectedRoute>} />
        {/* Phase 2: Trading Accounts - temporarily disabled for backlog #18 */}
        {/* <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} /> */}
        {/* <Route path="/performance-alerts" element={<ProtectedRoute><PerformanceAlerts /></ProtectedRoute>} /> */}
        {/* Exchange connections temporarily hidden for future use */}
        {/* <Route path="/exchange-connections" element={<ProtectedRoute><ExchangeConnections /></ProtectedRoute>} /> */}
        {/* Phase 2: Progress Analytics (IXP/XP) - temporarily disabled for backlog #36 */}
        {/* <Route path="/progress-analytics" element={<ProtectedRoute><ProgressAnalytics /></ProtectedRoute>} /> */}
        <Route path="/my-metrics" element={<ProtectedRoute><MyMetrics /></ProtectedRoute>} />
        <Route path="/user-guide" element={<ProtectedRoute><UserGuide /></ProtectedRoute>} />
        <Route path="/accessibility" element={<ProtectedRoute><AccessibilityGuide /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/cookie-policy" element={<PublicPageThemeWrapper><CookiePolicy /></PublicPageThemeWrapper>} />
        <Route path="/blog/article/:slug" element={<PublicPageThemeWrapper><BlogArticle /></PublicPageThemeWrapper>} />
        <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
        <Route path="/api-docs" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
        <Route path="/advanced-analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
        {/* Phase 2: Social Feed - temporarily disabled for backlog #34 */}
        {/* <Route path="/social-feed" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} /> */}
        <Route path="/testimonials" element={<PublicPageThemeWrapper><Testimonials /></PublicPageThemeWrapper>} />
        <Route path="/changelog" element={<PublicPageThemeWrapper><ChangelogPage /></PublicPageThemeWrapper>} />
        <Route path="/how-it-works" element={<PublicPageThemeWrapper><HowItWorks /></PublicPageThemeWrapper>} />
        <Route path="/features" element={<PublicPageThemeWrapper><FeaturesPage /></PublicPageThemeWrapper>} />
        <Route path="/custom/:pageId" element={<ProtectedRoute><CustomPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

const App = () => {
  const [i18nReady, setI18nReady] = useState(i18n.isInitialized);

  useEffect(() => {
    // Wait for i18n to be initialized before rendering
    const checkInitialized = () => {
      if (i18n.isInitialized) {
        setI18nReady(true);
      }
    };

    checkInitialized();

    // Listen for initialization event
    i18n.on('initialized', checkInitialized);

    return () => {
      i18n.off('initialized', checkInitialized);
    };
  }, []);

  // Show loading spinner while i18n initializes
  if (!i18nReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} storageKey="app-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <LanguageProvider>
                <ThemeInitializer />
                <AuthProvider>
                  <SubscriptionProvider>
                  <AccountProvider>
                  <CalmModeProvider>
                    <CurrencyProvider>
                      <BlurProvider>
                        <AIAssistantProvider>
                          <DateRangeProvider>
                            <AppRoutes />
                            <ConversionTracking />
                            <PerformanceMonitor />
                            <GlobalSearch />
                            <OfflineIndicator />
                            <InstallPrompt />
                          </DateRangeProvider>
                        </AIAssistantProvider>
                      </BlurProvider>
                    </CurrencyProvider>
                  </CalmModeProvider>
                  </AccountProvider>
                  </SubscriptionProvider>
                </AuthProvider>
              </LanguageProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
