import AppLayout from '@/components/layout/AppLayout';
import { TradingJournal } from '@/components/TradingJournal';
import { RiskCalculator } from '@/components/RiskCalculator';
import { ExpenseTracker } from '@/components/ExpenseTracker';
import { EnhancedStopLossCalculator } from '@/components/risk/EnhancedStopLossCalculator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Calculator, Receipt, Target } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { pageMeta } from '@/utils/seoHelpers';
import { SkipToContent } from '@/components/SkipToContent';

const Tools = () => {
  usePageMeta(pageMeta.tools);
  return (
    <AppLayout>
      <SkipToContent />
      <main id="main-content" className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold" id="tools-heading">Trading Tools</h1>
          <p className="text-muted-foreground mt-1">
            Journal your trades and calculate risk metrics
          </p>
        </header>

        <Tabs defaultValue="journal" className="space-y-6">
          <TabsList className="w-full max-w-4xl glass overflow-x-auto flex md:grid md:grid-cols-4">
            <TabsTrigger value="journal" className="gap-2 flex-1 md:flex-none min-w-[120px]">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Journal</span>
              <span className="sm:hidden">Journal</span>
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2 flex-1 md:flex-none min-w-[120px]">
              <Calculator className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Risk Calculator</span>
              <span className="sm:hidden">Risk</span>
            </TabsTrigger>
            <TabsTrigger value="stoploss" className="gap-2 flex-1 md:flex-none min-w-[120px]">
              <Target className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Stop Loss</span>
              <span className="sm:hidden">Stop</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-2 flex-1 md:flex-none min-w-[120px]">
              <Receipt className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Expenses</span>
              <span className="sm:hidden">Expenses</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journal">
            <TradingJournal />
          </TabsContent>

          <TabsContent value="calculator">
            <RiskCalculator />
          </TabsContent>

          <TabsContent value="stoploss">
            <EnhancedStopLossCalculator />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpenseTracker />
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
};

export default Tools;
