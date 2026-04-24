import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AppLayout from "@/components/layout/AppLayout";
import { PlanOverview } from "@/components/trading-plan/PlanOverview";
import { PlanEditor } from "@/components/trading-plan/PlanEditor";
import { PlanChecklist } from "@/components/trading-plan/PlanChecklist";
import { FileText, List, CheckSquare, BookOpen } from "lucide-react";
import { SEO } from "@/components/SEO";
import { pageMeta } from "@/utils/seoHelpers";

export default function TradingPlan() {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("plans");

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsEditing(true);
    setActiveTab("editor");
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsEditing(true);
    setActiveTab("editor");
  };

  const handleSavePlan = () => {
    setIsEditing(false);
    setSelectedPlan(null);
    setActiveTab("plans");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedPlan(null);
    setActiveTab("plans");
  };

  return (
    <>
      <SEO
        title={pageMeta.tradingPlan.title}
        description={pageMeta.tradingPlan.description}
        keywords={pageMeta.tradingPlan.keywords}
        canonical={pageMeta.tradingPlan.canonical}
        noindex={true}
      />
      <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Trading Plan</h1>
            <p className="text-muted-foreground">Create and follow your structured trading strategy</p>
          </div>
        </div>

        {/* Editor replaces tabs when active — no disabled/invisible tabs */}
        {isEditing ? (
          <PlanEditor
            plan={selectedPlan}
            onSave={handleSavePlan}
            onCancel={handleCancelEdit}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="plans" className="gap-2">
                <List className="h-4 w-4" />
                My Plans
              </TabsTrigger>
              <TabsTrigger value="checklist" className="gap-2">
                <CheckSquare className="h-4 w-4" />
                Checklist
              </TabsTrigger>
            </TabsList>

            <TabsContent value="plans">
              <PlanOverview
                onCreatePlan={handleCreatePlan}
                onEditPlan={handleEditPlan}
              />
            </TabsContent>

            <TabsContent value="checklist">
              <PlanChecklist />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
    </>
  );
}
