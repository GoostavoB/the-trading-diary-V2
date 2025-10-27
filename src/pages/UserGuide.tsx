import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/components/layout/AppLayout';
import { 
  BookOpen, Search, Star, Heart, Menu, Settings, Keyboard, 
  AlertCircle, HelpCircle, Download, ThumbsUp, ThumbsDown,
  Zap, TrendingUp, Shield, Users, FileText, Calendar,
  ChevronRight, ExternalLink
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

export default function UserGuide() {
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    toast.success('Thank you for your feedback!');
  };

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">User Guide</h1>
                <p className="text-muted-foreground">
                  Everything you need to master The Trading Diary
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Quick Start
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guide..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs defaultValue="quick-start" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Quick Start */}
          <TabsContent value="quick-start" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle>Quick Start: Get Started in 3 Minutes</CardTitle>
                </div>
                <CardDescription>
                  Follow these 5 steps to start tracking your trades and gaining insights immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">Add Your First Trade</h3>
                    <p className="text-muted-foreground">
                      Navigate to <strong>Trades → Add Trade</strong> in the left menu. You can:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Upload a screenshot (up to 10 trades per image)</li>
                      <li>Connect your exchange API for auto-sync</li>
                      <li>Enter trade details manually</li>
                      <li>Export your data to CSV anytime</li>
                    </ul>
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <strong>Tip:</strong> Screenshot every 10 trades to save upload credits.
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      [screenshot: Upload trade form with image upload option highlighted]
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">View Your Dashboard</h3>
                    <p className="text-muted-foreground">
                      Go to <strong>Dashboard</strong> to see your performance metrics instantly:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Total profit/loss</li>
                      <li>Win rate percentage</li>
                      <li>Current streak</li>
                      <li>Portfolio allocation</li>
                    </ul>
                    <Badge variant="outline" className="mt-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Widgets update in real-time as you add trades
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">Set Your Favorites</h3>
                    <p className="text-muted-foreground">
                      Hover over any page in the left menu and click the <Heart className="h-4 w-4 inline" /> heart icon to add it to your Favorites section at the top.
                    </p>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-sm">
                      <strong>Limit:</strong> Maximum 12 favorites. Remove one to add another.
                    </div>
                    <div className="text-sm text-muted-foreground italic">
                      [screenshot: Favorites heart icon hover state]
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    4
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">Analyze Your Performance</h3>
                    <p className="text-muted-foreground">
                      Visit <strong>Trades → Trade Analysis</strong> to see:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Win/loss breakdown by asset</li>
                      <li>Best performing setups</li>
                      <li>Time-of-day performance</li>
                      <li>Fee efficiency analysis</li>
                    </ul>
                  </div>
                </div>

                <Separator />

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    5
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">Customize Your Experience</h3>
                    <p className="text-muted-foreground">
                      Click <Settings className="h-4 w-4 inline" /> <strong>Settings</strong> to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>Change theme and accent colors</li>
                      <li>Set your preferred language</li>
                      <li>Configure notifications</li>
                      <li>Manage privacy settings</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-primary/10 rounded-lg">
                  <p className="text-center font-semibold">
                    🎉 Congratulations! You're now ready to track and improve your trading performance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navigation */}
          <TabsContent value="navigation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Menu className="h-5 w-5 text-primary" />
                  <CardTitle>Navigation Overview</CardTitle>
                </div>
                <CardDescription>
                  Understanding the left menu, sections, and search functionality.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Left Menu */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <ChevronRight className="h-5 w-5 text-primary" />
                    Left Sidebar Menu
                  </h3>
                  <p className="text-muted-foreground">
                    The left sidebar is your main navigation hub. It contains all app sections organized into collapsible groups.
                  </p>
                  
                  <div className="space-y-4 mt-4">
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-primary fill-primary" />
                        <strong>Favorites Section</strong>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your favorited pages appear at the top for quick access. Maximum 12 items.
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg space-y-2">
                      <strong>Section Groups</strong>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• <strong>Dashboard:</strong> Overview and widgets</li>
                        <li>• <strong>Portfolio:</strong> Wallet, exchanges, accounts</li>
                        <li>• <strong>Trades:</strong> Add, analyze, and manage trades</li>
                        <li>• <strong>Analytics:</strong> Market data, forecasts, alerts</li>
                        <li>• <strong>Planning:</strong> Trading plan, goals, psychology</li>
                        <li>• <strong>Reports:</strong> Generated reports and exports</li>
                        <li>• <strong>Community:</strong> Social, leaderboard, achievements</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Search */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Menu Search
                  </h3>
                  <p className="text-muted-foreground">
                    Type in the search box at the top of the sidebar to find pages quickly. The search looks at:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Page titles</li>
                    <li>• Related keywords (e.g., "wallet" finds Spot Wallet)</li>
                    <li>• Common terms and synonyms</li>
                  </ul>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <strong>Example:</strong> Type "btc" to find Market Data, Spot Wallet, and Trade Analysis pages.
                  </div>
                </div>

                <Separator />

                {/* Favorites */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Managing Favorites
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <strong className="text-sm">Adding a Favorite:</strong>
                      <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 mt-2 ml-2">
                        <li>Hover over any menu item</li>
                        <li>Click the heart icon that appears</li>
                        <li>The page is added to your Favorites section</li>
                      </ol>
                    </div>

                    <div>
                      <strong className="text-sm">Removing a Favorite:</strong>
                      <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 mt-2 ml-2">
                        <li>Hover over the favorited item</li>
                        <li>Click the filled heart icon</li>
                        <li>The page is removed from Favorites</li>
                      </ol>
                    </div>

                    <Badge variant="outline" className="mt-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Favorites sync across all your devices
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pages and Features</CardTitle>
                <CardDescription>
                  What each page does and when to use it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="dashboard">
                    <AccordionTrigger>Dashboard</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p><strong>Purpose:</strong> Your central hub for real-time performance metrics.</p>
                      <p className="text-sm text-muted-foreground">
                        The dashboard displays customizable widgets showing key statistics:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Total balance and P&L</li>
                        <li>• Win rate and current streak</li>
                        <li>• Recent trades</li>
                        <li>• Portfolio allocation</li>
                        <li>• Market movers</li>
                      </ul>
                      <p className="text-sm"><strong>When to use:</strong> Check daily for performance snapshot.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="spot-wallet">
                    <AccordionTrigger>Spot Wallet</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p><strong>Purpose:</strong> Track your cryptocurrency holdings and allocation.</p>
                      <p className="text-sm text-muted-foreground">
                        Manage your portfolio by adding tokens and monitoring their value:
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Add tokens with quantity</li>
                        <li>• View real-time prices</li>
                        <li>• See allocation percentages</li>
                        <li>• Track total portfolio value</li>
                      </ul>
                      <div className="p-3 bg-muted rounded-lg text-sm mt-3">
                        <strong>Field limits:</strong> Token symbols must be valid. Quantities support up to 8 decimals.
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="exchanges">
                    <AccordionTrigger>Exchange Connections</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p><strong>Purpose:</strong> Connect exchange APIs to automatically sync trades.</p>
                      <p className="text-sm text-muted-foreground">
                        Supported exchanges include Binance, Bybit, Coinbase, and more.
                      </p>
                      <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
                        <li>Click "Connect" on any exchange</li>
                        <li>Enter your API key and secret</li>
                        <li>Click "Sync Trades" to fetch history</li>
                        <li>Review and import selected trades</li>
                      </ol>
                      <Badge variant="outline" className="mt-2">
                        <Shield className="h-3 w-3 mr-1" />
                        API keys are encrypted and never shared
                      </Badge>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="trade-analysis">
                    <AccordionTrigger>Trade Analysis</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p><strong>Purpose:</strong> Deep dive into your trading performance.</p>
                      <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                        <li>• Win rate by asset and setup</li>
                        <li>• Best trading hours</li>
                        <li>• Average hold time</li>
                        <li>• Profit factor analysis</li>
                      </ul>
                      <p className="text-sm"><strong>When to use:</strong> Weekly review to identify patterns.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="psychology">
                    <AccordionTrigger>Psychology Tracker</AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      <p><strong>Purpose:</strong> Log emotional states and identify behavior patterns.</p>
                      <p className="text-sm text-muted-foreground">
                        Track your mindset before, during, and after trades to improve discipline.
                      </p>
                      <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-2">
                        <li>Select your emotional state</li>
                        <li>Rate confidence level (1-10)</li>
                        <li>Add notes about your mindset</li>
                        <li>Review patterns over time</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="risk-management" id="risk-management">
                    <AccordionTrigger>Risk Management</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <p><strong>Purpose:</strong> Monitor and control your trading risk exposure across multiple dimensions.</p>
                      
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Overview Tab - Key Metrics:</h4>
                        
                        <div className="space-y-3 ml-4">
                          <div className="p-3 border rounded-lg space-y-1" id="daily-risk">
                            <strong className="text-sm">Daily Risk Exposure</strong>
                            <p className="text-xs text-muted-foreground">
                              <strong>Formula:</strong> Average loss per trade × 0.5 (estimated daily exposure)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>What it means:</strong> Maximum acceptable loss per trading day based on your historical average losses.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Safe zone:</strong> Below 50% of your daily limit. Yellow at 50-80%, red above 80%.
                            </p>
                          </div>

                          <div className="p-3 border rounded-lg space-y-1" id="weekly-risk">
                            <strong className="text-sm">Weekly Risk Exposure</strong>
                            <p className="text-xs text-muted-foreground">
                              <strong>Formula:</strong> Daily Risk × 3 (cumulative exposure over 7 days)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>What it means:</strong> Total risk accumulated over the week to prevent overtrading.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Interpretation:</strong> If you hit your weekly limit by Wednesday, stop trading until next week.
                            </p>
                          </div>

                          <div className="p-3 border rounded-lg space-y-1" id="monthly-risk">
                            <strong className="text-sm">Monthly Risk Exposure</strong>
                            <p className="text-xs text-muted-foreground">
                              <strong>Formula:</strong> Daily Risk × 12 (monthly exposure estimate)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>What it means:</strong> Maximum acceptable loss for the current month based on your risk profile.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Example:</strong> If daily risk is $100, monthly risk is $1,200 (12 trading days).
                            </p>
                          </div>

                          <div className="p-3 border rounded-lg space-y-1" id="current-drawdown">
                            <strong className="text-sm">Current Drawdown</strong>
                            <p className="text-xs text-muted-foreground">
                              <strong>Formula:</strong> ((Current Equity - Peak Equity) / Peak Equity) × 100
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>What it means:</strong> How far your account has fallen from its highest point.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Warning levels:</strong> 5-10% = caution, 10-20% = high risk, &gt;20% = critical.
                            </p>
                          </div>

                          <div className="p-3 border rounded-lg space-y-1" id="var">
                            <strong className="text-sm">Value at Risk (VaR 95%)</strong>
                            <p className="text-xs text-muted-foreground">
                              <strong>Formula:</strong> 5th percentile of all historical losses
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>What it means:</strong> The maximum expected loss with 95% confidence on a single trade.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Example:</strong> VaR of $200 means 95% of your trades won't lose more than $200.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Calculators Tab:</h4>
                        
                        <div className="space-y-3 ml-4">
                          <div className="p-3 bg-accent/50 rounded-lg">
                            <strong className="text-sm">Position Size Calculator</strong>
                            <p className="text-xs text-muted-foreground mt-1">
                              Calculate how many units to trade based on your risk tolerance and stop loss distance.
                            </p>
                          </div>

                          <div className="p-3 bg-accent/50 rounded-lg">
                            <strong className="text-sm">Stop Loss Calculator</strong>
                            <p className="text-xs text-muted-foreground mt-1">
                              Determine where to place your stop loss for both long and short positions to maintain your risk per trade.
                            </p>
                          </div>

                          <div className="p-3 bg-accent/50 rounded-lg">
                            <strong className="text-sm">Leverage Calculator</strong>
                            <p className="text-xs text-muted-foreground mt-1">
                              Calculate margin requirements and liquidation prices for leveraged positions. Shows risk levels from low to extreme.
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Drawdown Tab:</h4>
                        <p className="text-xs text-muted-foreground ml-4">
                          Visualize your equity curve and drawdown periods. Includes recovery strategy recommendations based on your current drawdown level.
                        </p>
                      </div>

                      <div className="p-3 bg-primary/10 rounded-lg text-sm mt-3">
                        <strong>Best Practice:</strong> Check Risk Management daily before trading. If any metric is in the red zone, reduce position sizes or take a break.
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="performance-metrics" id="performance-metrics">
                    <AccordionTrigger>Performance Metrics Explained</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <p><strong>Purpose:</strong> Understanding the key performance indicators that measure trading success.</p>
                      
                      <div className="space-y-3 ml-4">
                        <div className="p-3 border rounded-lg space-y-1" id="win-rate">
                          <strong className="text-sm">Win Rate</strong>
                          <p className="text-xs text-muted-foreground">
                            <strong>Formula:</strong> (Winning Trades / Total Trades) × 100
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>What it means:</strong> Percentage of trades that resulted in profit.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> 60 wins out of 100 trades = 60% win rate.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Good target:</strong> 50%+ for swing trading, 60%+ for scalping.
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg space-y-1" id="profit-factor">
                          <strong className="text-sm">Profit Factor</strong>
                          <p className="text-xs text-muted-foreground">
                            <strong>Formula:</strong> Gross Profit / Gross Loss
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>What it means:</strong> How much profit you make for every dollar lost.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> $10,000 profits, $5,000 losses = 2.0 profit factor.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Good target:</strong> Above 1.5 is solid, above 2.0 is excellent.
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg space-y-1" id="avg-win-loss">
                          <strong className="text-sm">Average Win / Average Loss</strong>
                          <p className="text-xs text-muted-foreground">
                            <strong>Formula:</strong> (Total Wins / # of Wins) and (Total Losses / # of Losses)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>What it means:</strong> Your typical profit vs typical loss size.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> Avg win $150, avg loss $100 = 1.5:1 ratio.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Key insight:</strong> You can have 40% win rate and still be profitable if avg win is 2x avg loss.
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg space-y-1" id="sharpe-ratio">
                          <strong className="text-sm">Sharpe Ratio</strong>
                          <p className="text-xs text-muted-foreground">
                            <strong>Formula:</strong> (Average Return - Risk-Free Rate) / Standard Deviation of Returns
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>What it means:</strong> Risk-adjusted return. Higher is better.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Interpretation:</strong> &lt;1 = poor, 1-2 = acceptable, 2-3 = good, &gt;3 = excellent.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> Two traders with 20% returns, but one with lower volatility has higher Sharpe ratio.
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg space-y-1" id="roi">
                          <strong className="text-sm">Return on Investment (ROI)</strong>
                          <p className="text-xs text-muted-foreground">
                            <strong>Formula:</strong> (Net Profit / Initial Capital) × 100
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>What it means:</strong> Percentage return on your starting capital.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> Start with $10,000, profit $2,000 = 20% ROI.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Note:</strong> Always consider timeframe (20% in 1 year vs 1 month).
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg space-y-1" id="expectancy">
                          <strong className="text-sm">Expectancy</strong>
                          <p className="text-xs text-muted-foreground">
                            <strong>Formula:</strong> (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>What it means:</strong> Average amount you expect to win or lose per trade.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> 60% win rate, $150 avg win, 40% loss rate, $100 avg loss = (0.6 × 150) - (0.4 × 100) = $50 expectancy.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Goal:</strong> Positive expectancy means profitable strategy long-term.
                          </p>
                        </div>

                        <div className="p-3 border rounded-lg space-y-1" id="max-consecutive">
                          <strong className="text-sm">Max Consecutive Wins/Losses</strong>
                          <p className="text-xs text-muted-foreground">
                            <strong>What it means:</strong> Longest streak of wins or losses.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Why it matters:</strong> Helps you prepare psychologically for losing streaks.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <strong>Example:</strong> 5 consecutive losses means you need capital to survive 5+ losses.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-primary/10 rounded-lg text-sm mt-3">
                        <strong>Best Practice:</strong> No single metric tells the full story. Review Win Rate, Profit Factor, and Average Win/Loss together for complete picture.
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tips */}
          <TabsContent value="tips" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tips & Best Practices</CardTitle>
                <CardDescription>
                  10 concrete tips to get the most from The Trading Diary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    number: 1,
                    title: "Log trades immediately after closing",
                    description: "Don't wait until end of day. Capture emotions and reasoning while fresh.",
                    example: "Add a journal note right after a winning trade to document what went right."
                  },
                  {
                    number: 2,
                    title: "Use image uploads for bulk imports",
                    description: "Faster than manual entry. Upload screenshots every 10 trades.",
                    example: "Screenshot your completed trades and upload to save time."
                  },
                  {
                    number: 3,
                    title: "Set weekly review reminders",
                    description: "Consistent reviews reveal patterns you'd otherwise miss.",
                    example: "Every Sunday, check Trade Analysis for your best/worst performing assets."
                  },
                  {
                    number: 4,
                    title: "Tag trades with setup types",
                    description: "Breakout, reversal, scalp, etc. Track what works for your style.",
                    example: "If breakout trades have 60% win rate, focus more on those setups."
                  },
                  {
                    number: 5,
                    title: "Monitor fee efficiency monthly",
                    description: "High fees eat into profits. Fee Analysis page shows where you're losing money.",
                    example: "Switch from maker/taker if your style doesn't benefit from maker rebates."
                  },
                  {
                    number: 6,
                    title: "Set realistic goals using the Goals page",
                    description: "Break big targets into monthly milestones.",
                    example: "Instead of '100% yearly return,' aim for '8% monthly' to track progress."
                  },
                  {
                    number: 7,
                    title: "Use Psychology Tracker after losses",
                    description: "Emotional data reveals tilt patterns and revenge trading.",
                    example: "Notice you trade more after losses? That's revenge trading. Log it."
                  },
                  {
                    number: 8,
                    title: "Connect exchanges for real-time sync",
                    description: "No manual entry needed. Trades appear automatically.",
                    example: "Connect Binance API once, never manually log Binance trades again."
                  },
                  {
                    number: 9,
                    title: "Export monthly reports for tax records",
                    description: "Keep organized records for accountant or tax software.",
                    example: "Reports → Generate Monthly → Export as Excel. Store in tax folder."
                  },
                  {
                    number: 10,
                    title: "Favorite your most-used pages",
                    description: "Quick access saves time. Heart icon on hover.",
                    example: "Favorite: Dashboard, Trade Analysis, and Add Trade for daily workflow."
                  }
                ].map((tip) => (
                  <div key={tip.number} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                        {tip.number}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-semibold">{tip.title}</h4>
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                        <div className="p-2 bg-muted rounded text-sm">
                          <strong>Example:</strong> {tip.example}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Troubleshooting */}
          <TabsContent value="troubleshooting" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <CardTitle>Troubleshooting</CardTitle>
                </div>
                <CardDescription>
                  Top 15 issues with causes and fixes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    {
                      issue: "Trades not syncing from exchange",
                      cause: "Invalid API key, expired connection, or network issue",
                      fix: "1. Check API key permissions (read access required)\n2. Verify key hasn't expired\n3. Disconnect and reconnect exchange\n4. Check firewall/VPN settings"
                    },
                    {
                      issue: "Dashboard widgets not updating",
                      cause: "Browser cache or slow network",
                      fix: "1. Refresh the page (F5 or Cmd+R)\n2. Clear browser cache\n3. Check if trades are actually added\n4. Sign out and sign back in"
                    },
                    {
                      issue: "Can't add more favorites",
                      cause: "12 favorite limit reached",
                      fix: "1. Remove an existing favorite (click filled heart)\n2. Choose which pages you use most\n3. Use search for occasional pages"
                    },
                    {
                      issue: "CSV upload fails",
                      cause: "Unsupported format or corrupted file",
                      fix: "1. Verify CSV is from supported broker\n2. Check file isn't corrupted (open in Excel)\n3. Remove any custom formatting\n4. Try manual entry for single trades"
                    },
                    {
                      issue: "Win rate seems incorrect",
                      cause: "Trades missing outcome or duplicate entries",
                      fix: "1. Check all trades have profit/loss values\n2. Look for duplicate trades (same time/asset)\n3. Verify trade outcomes are logged correctly\n4. Recalculate from Trade Analysis page"
                    },
                    {
                      issue: "Charts not displaying",
                      cause: "Insufficient data or browser compatibility",
                      fix: "1. Add at least 5 trades for meaningful charts\n2. Use modern browser (Chrome, Firefox, Safari)\n3. Disable ad blockers temporarily\n4. Check JavaScript is enabled"
                    },
                    {
                      issue: "Mobile app not installing",
                      cause: "Browser doesn't support PWA",
                      fix: "1. Use Chrome or Safari on mobile\n2. Visit from browser (not social media app)\n3. Look for 'Add to Home Screen' in browser menu\n4. Accept any permission prompts"
                    },
                    {
                      issue: "Notifications not appearing",
                      cause: "Permissions not granted",
                      fix: "1. Settings → Notifications → Enable\n2. Check browser notification permissions\n3. Verify device notifications are on\n4. Re-login to refresh permissions"
                    },
                    {
                      issue: "Portfolio value incorrect",
                      cause: "Outdated prices or wrong quantities",
                      fix: "1. Refresh page for latest prices\n2. Verify token quantities are correct\n3. Check for duplicate token entries\n4. Remove and re-add problem tokens"
                    },
                    {
                      issue: "Can't log in",
                      cause: "Wrong credentials, email not confirmed, or account issue",
                      fix: "1. Use 'Forgot Password' to reset\n2. Check email for confirmation link\n3. Verify email spelling\n4. Contact support if issue persists"
                    },
                    {
                      issue: "Reports not generating",
                      cause: "Not enough data or date range issue",
                      fix: "1. Ensure you have trades in selected period\n2. Check start date is before end date\n3. Try shorter date range\n4. Wait 30 seconds and refresh"
                    },
                    {
                      issue: "Search not finding pages",
                      cause: "Typo or using wrong keywords",
                      fix: "1. Try partial words (e.g., 'trade' finds Trade Analysis)\n2. Use common terms (e.g., 'fees' finds Fee Analysis)\n3. Check spelling\n4. Browse menu sections manually"
                    },
                    {
                      issue: "Theme not saving",
                      cause: "Browser blocking cookies/storage",
                      fix: "1. Enable cookies for this site\n2. Check browser privacy settings\n3. Use normal mode (not private/incognito)\n4. Sign in to sync preferences"
                    },
                    {
                      issue: "Slow performance",
                      cause: "Too many widgets or old browser",
                      fix: "1. Close unused browser tabs\n2. Update browser to latest version\n3. Remove some dashboard widgets\n4. Clear browser cache and cookies"
                    },
                    {
                      issue: "Exchange API connection failed",
                      cause: "Wrong credentials or insufficient permissions",
                      fix: "1. Double-check API key and secret\n2. Verify API has 'Read' permission\n3. Check IP whitelist if using one\n4. Generate new API key from exchange"
                    }
                  ].map((item, index) => (
                    <AccordionItem key={index} value={`issue-${index}`}>
                      <AccordionTrigger className="text-left">
                        {index + 1}. {item.issue}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <div>
                          <strong className="text-sm">Cause:</strong>
                          <p className="text-sm text-muted-foreground mt-1">{item.cause}</p>
                        </div>
                        <div>
                          <strong className="text-sm">Fix:</strong>
                          <pre className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                            {item.fix}
                          </pre>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </div>
                <CardDescription>
                  20 common questions with concise answers.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {[
                    { q: "Is my trading data private?", a: "Yes. All data is encrypted and only visible to you. We never share or sell your data. See our Privacy Policy for details." },
                    { q: "Can I use this offline?", a: "The app works offline for viewing data. New trades and syncing require internet connection." },
                    { q: "Which exchanges are supported?", a: "Binance, Bybit, Coinbase, OKX, Kraken, KuCoin, Gate.io, MEXC, Bitfinex, Bitstamp, BingX. More coming soon." },
                    { q: "How do I delete a trade?", a: "Go to Trade Analysis, find the trade, click the three-dot menu, select Delete. Soft-deleted for 48 hours before permanent removal." },
                    { q: "Can I export my data?", a: "Yes. Reports → Export trades as CSV or Excel. Choose date range and export format." },
                    { q: "What's the maximum number of trades?", a: "You can upload up to 10 trades per screenshot. Monthly limits: Starter (20 uploads), Pro (50 uploads), Elite (120 uploads)." },
                    { q: "How are fees calculated?", a: "Automatically from image uploads or manual entry. Fee Analysis page shows breakdown by exchange and trade type (Pro/Elite only)." },
                    { q: "Can I share my performance?", a: "Yes. Social tab lets you share trade cards and connect with other traders. Choose public or private settings." },
                    { q: "Is there a mobile app?", a: "Progressive Web App (PWA) works on all devices. Install via browser menu: Add to Home Screen." },
                    { q: "How do I change my password?", a: "Settings → Security → Change Password. Enter current password, then new password twice." },
                    { q: "What's the difference between ROI and P&L?", a: "P&L is absolute profit/loss in currency. ROI is percentage return on investment. See Glossary for more terms." },
                    { q: "Can I track multiple accounts?", a: "Yes. Trading Accounts page lets you add unlimited accounts and track capital separately." },
                    { q: "How often should I log trades?", a: "Immediately after closing. Fresh emotions and reasoning are valuable for psychology tracking." },
                    { q: "What are XP and levels for?", a: "Gamification rewards consistent logging and good habits. Earn XP by adding trades, maintaining streaks, and completing challenges." },
                    { q: "Can I undo a deleted trade?", a: "Within 48 hours, yes. After that, it's permanently removed. Contact support immediately if needed." },
                    { q: "Why is my win rate different from my broker's?", a: "Our calculation includes all fees and may count partially-filled orders differently. Check Trade Analysis for methodology." },
                    { q: "How do I set price alerts?", a: "Performance Alerts page. Set conditions (e.g., BTC > $50k) and get notifications via email or in-app." },
                    { q: "What's a trading setup?", a: "A predefined strategy pattern (e.g., breakout, reversal). Tag trades with setups to analyze which work best for you." },
                    { q: "Can I import from TradingView?", a: "Screenshot your TradingView trades and upload. Alternatively, export from TradingView to CSV, then import to Excel for manual entry." },
                    { q: "How do upload credits work?", a: "Each image upload uses 1 credit and can contain up to 10 trades. Credits reset monthly. Buy extras: $2 for 10 uploads ($1 for Elite)." },
                    { q: "How do I contact support?", a: "Settings → Help & Support → Contact Us. Include screenshots for faster resolution." }
                  ].map((item, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                      <AccordionTrigger className="text-left">
                        {index + 1}. {item.q}
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">{item.a}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Glossary */}
        <Card>
          <CardHeader>
            <CardTitle>Glossary</CardTitle>
            <CardDescription>
              Clear definitions of product terms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { term: "P&L (Profit & Loss)", def: "The absolute monetary gain or loss from trades, in your account currency." },
                { term: "ROI (Return on Investment)", def: "Percentage gain or loss relative to your initial capital." },
                { term: "Win Rate", def: "Percentage of profitable trades out of total trades." },
                { term: "Drawdown", def: "Peak-to-trough decline in account balance during a specific period." },
                { term: "Setup", def: "A predefined trading strategy pattern (e.g., breakout, reversal, scalp)." },
                { term: "Maker/Taker Fees", def: "Maker adds liquidity (limit order). Taker removes liquidity (market order). Different fee rates." },
                { term: "Spot Trading", def: "Buying/selling cryptocurrency for immediate delivery. No leverage." },
                { term: "Futures Trading", def: "Contract to buy/sell at future date. Allows leverage and short positions." },
                { term: "Long Position", def: "Buying an asset expecting price to rise." },
                { term: "Short Position", def: "Selling borrowed asset expecting price to fall." },
                { term: "Leverage", def: "Borrowing funds to amplify position size. Increases both profit and loss potential." },
                { term: "Stop Loss", def: "Order that automatically closes position at specified loss level to limit risk." },
                { term: "Take Profit", def: "Order that automatically closes position when target profit is reached." },
                { term: "Slippage", def: "Difference between expected trade price and actual execution price." },
                { term: "Liquidation", def: "Forced closure of leveraged position when losses exceed margin requirements." },
                { term: "API Key", def: "Credentials allowing app to access your exchange data securely without password." }
              ].map((item, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-1">
                  <strong className="text-sm">{item.term}</strong>
                  <p className="text-sm text-muted-foreground">{item.def}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Was this guide helpful?</CardTitle>
            <CardDescription>
              Your feedback helps us improve the documentation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={feedback === 'up' ? 'default' : 'outline'}
                onClick={() => handleFeedback('up')}
                className="flex-1"
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Helpful
              </Button>
              <Button
                variant={feedback === 'down' ? 'default' : 'outline'}
                onClick={() => handleFeedback('down')}
                className="flex-1"
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Not Helpful
              </Button>
            </div>
            
            {feedback && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional comments (optional)</label>
                <textarea
                  className="w-full min-h-[100px] p-3 border rounded-lg resize-none text-sm"
                  placeholder="Tell us more about your experience..."
                />
                <Button size="sm">Submit Feedback</Button>
              </div>
            )}

            <Separator />

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Privacy & Data:</strong> Learn how we protect your information in our{' '}
                <a href="/privacy" className="text-primary hover:underline inline-flex items-center gap-1">
                  Privacy Policy
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p>
                <strong>Need more help?</strong> Contact support at{' '}
                <a href="mailto:support@thetradingdiary.com" className="text-primary hover:underline">
                  support@thetradingdiary.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}