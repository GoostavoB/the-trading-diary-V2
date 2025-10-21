import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AIAssistantProvider } from "@/contexts/AIAssistantContext";
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
const FAQ = lazy(() => import("./pages/FAQ"));
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
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const LongShortRatio = lazy(() => import("./pages/LongShortRatio"));
const EconomicCalendar = lazy(() => import("./pages/EconomicCalendar"));
const TaxReports = lazy(() => import("./pages/TaxReports"));
const Accounts = lazy(() => import("./pages/Accounts"));
const PerformanceAlerts = lazy(() => import("./pages/PerformanceAlerts"));

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
              <CalmModeProvider>
                <AIAssistantProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/logo-download" element={<LogoDownload />} />
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
                      <Route path="/blog" element={<ProtectedRoute><Blog /></ProtectedRoute>} />
                      <Route path="/blog/:slug" element={<ProtectedRoute><BlogPost /></ProtectedRoute>} />
                      <Route path="/faq" element={<ProtectedRoute><FAQ /></ProtectedRoute>} />
                      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                      <Route path="/long-short-ratio" element={<ProtectedRoute><LongShortRatio /></ProtectedRoute>} />
                      <Route path="/economic-calendar" element={<ProtectedRoute><EconomicCalendar /></ProtectedRoute>} />
                      <Route path="/tax-reports" element={<ProtectedRoute><TaxReports /></ProtectedRoute>} />
                      <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                      <Route path="/performance-alerts" element={<ProtectedRoute><PerformanceAlerts /></ProtectedRoute>} />
                      <Route path="/exchange-connections" element={<ProtectedRoute><ExchangeConnections /></ProtectedRoute>} />
                      <Route path="/custom/:pageId" element={<ProtectedRoute><CustomPage /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <PerformanceMonitor />
                  <GlobalSearch />
                  <OfflineIndicator />
                  <InstallPrompt />
                </AIAssistantProvider>
              </CalmModeProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
