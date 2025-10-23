import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { AIAssistantProvider } from "@/contexts/AIAssistantContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CalmModeProvider } from "@/contexts/CalmModeContext";
import { ThemeProvider } from "next-themes";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { GlobalSearch } from "@/components/GlobalSearch";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { usePageTracking } from "@/hooks/usePageTracking";
import { ConversionTracking } from "@/components/ConversionTracking";
import { LanguageSync } from "@/components/LanguageSync";

// Eagerly load critical pages (landing and auth)
import Index from "./pages/Index";
import IndexPt from "./pages/IndexPt";
import IndexEs from "./pages/IndexEs";
import IndexAr from "./pages/IndexAr";
import IndexVi from "./pages/IndexVi";
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
const Social = lazy(() => import("./pages/Social"));
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
const ExchangeConnections = lazy(() => import("./pages/ExchangeConnections"));
const SpotWallet = lazy(() => import("./pages/SpotWallet"));
const FeeAnalysis = lazy(() => import("./pages/FeeAnalysis"));
const LogoDownload = lazy(() => import("./pages/LogoDownload"));
const LogoGenerator = lazy(() => import("./pages/LogoGenerator"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LongShortRatio = lazy(() => import("./pages/LongShortRatio"));
const EconomicCalendar = lazy(() => import("./pages/EconomicCalendar"));
const TaxReports = lazy(() => import("./pages/TaxReports"));
const Accounts = lazy(() => import("./pages/Accounts"));
const PerformanceAlerts = lazy(() => import("./pages/PerformanceAlerts"));
const ProgressAnalytics = lazy(() => import("./pages/ProgressAnalytics"));
const MyMetrics = lazy(() => import("./pages/MyMetrics"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const Contact = lazy(() => import("./pages/Contact"));
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
const SocialFeed = lazy(() => import("./pages/SocialFeed"));
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
        {/* Landing pages by language */}
        <Route path="/" element={<Index />} />
        <Route path="/pt" element={<IndexPt />} />
        <Route path="/es" element={<IndexEs />} />
        <Route path="/ar" element={<IndexAr />} />
        <Route path="/vi" element={<IndexVi />} />
        
        {/* Auth routes */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/:lang/auth" element={<Auth />} />
        
        {/* Public pages with language support */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/:lang/pricing" element={<PricingPage />} />
        
        <Route path="/contact" element={<Contact />} />
        <Route path="/:lang/contact" element={<Contact />} />
        
        <Route path="/legal" element={<Legal />} />
        <Route path="/:lang/legal" element={<Legal />} />
        
        <Route path="/terms" element={<Terms />} />
        <Route path="/:lang/terms" element={<Terms />} />
        
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/:lang/privacy" element={<Privacy />} />
        
        {/* Blog routes with language support */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/:lang/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/:lang/blog/:slug" element={<BlogPost />} />
        <Route path="/author/:authorSlug" element={<Author />} />
        
        {/* Other public pages */}
        <Route path="/logo-download" element={<LogoDownload />} />
        <Route path="/logo-generator" element={<LogoGenerator />} />
        <Route path="/crypto-trading-faq" element={<CryptoTradingFAQ />} />
        <Route path="/sitemap" element={<Sitemap />} />
        <Route path="/about" element={<About />} />
        <Route path="/:lang/about" element={<About />} />
        <Route path="/seo-dashboard" element={<SEODashboard />} />
        
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
        <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
        <Route path="/gamification" element={<ProtectedRoute><Gamification /></ProtectedRoute>} />
        <Route path="/market-data" element={<ProtectedRoute><MarketData /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        <Route path="/trade-analysis" element={<ProtectedRoute><TradeAnalysis /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/risk-management" element={<ProtectedRoute><RiskManagement /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/psychology" element={<ProtectedRoute><Psychology /></ProtectedRoute>} />
        <Route path="/trading-plan" element={<ProtectedRoute><TradingPlan /></ProtectedRoute>} />
        <Route path="/exchanges" element={<ProtectedRoute><ExchangeConnections /></ProtectedRoute>} />
        <Route path="/spot-wallet" element={<ProtectedRoute><SpotWallet /></ProtectedRoute>} />
        <Route path="/fee-analysis" element={<ProtectedRoute><FeeAnalysis /></ProtectedRoute>} />
        <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/long-short-ratio" element={<ProtectedRoute><LongShortRatio /></ProtectedRoute>} />
        <Route path="/economic-calendar" element={<ProtectedRoute><EconomicCalendar /></ProtectedRoute>} />
        <Route path="/tax-reports" element={<ProtectedRoute><TaxReports /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
        <Route path="/performance-alerts" element={<ProtectedRoute><PerformanceAlerts /></ProtectedRoute>} />
        <Route path="/exchange-connections" element={<ProtectedRoute><ExchangeConnections /></ProtectedRoute>} />
        <Route path="/progress-analytics" element={<ProtectedRoute><ProgressAnalytics /></ProtectedRoute>} />
        <Route path="/my-metrics" element={<ProtectedRoute><MyMetrics /></ProtectedRoute>} />
        <Route path="/user-guide" element={<ProtectedRoute><UserGuide /></ProtectedRoute>} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/:lang/cookie-policy" element={<CookiePolicy />} />
        <Route path="/blog/article/:slug" element={<BlogArticle />} />
        <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
        <Route path="/api-docs" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
        <Route path="/advanced-analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
        <Route path="/social-feed" element={<ProtectedRoute><SocialFeed /></ProtectedRoute>} />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/custom/:pageId" element={<ProtectedRoute><CustomPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} storageKey="app-theme">
        <ThemeInitializer />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <SubscriptionProvider>
              <CalmModeProvider>
                <CurrencyProvider>
                  <AIAssistantProvider>
                    <AppRoutes />
                    <ConversionTracking />
                    <PerformanceMonitor />
                    <GlobalSearch />
                    <OfflineIndicator />
                    <InstallPrompt />
                  </AIAssistantProvider>
                </CurrencyProvider>
              </CalmModeProvider>
              </SubscriptionProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
