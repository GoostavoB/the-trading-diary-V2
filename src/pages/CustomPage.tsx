import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { AIWidgetCreator } from '@/components/menu/AIWidgetCreator';
import { InteractiveAIWidgetCreator } from '@/components/menu/InteractiveAIWidgetCreator';
import { CustomWidgetRenderer } from '@/components/widgets/CustomWidgetRenderer';
import { useCustomWidgets } from '@/hooks/useCustomWidgets';
import { Sparkles, Zap } from 'lucide-react';

const CustomPage = () => {
  const { pageId } = useParams();
  const { widgets, loading, refreshWidgets } = useCustomWidgets();

  useEffect(() => {
    refreshWidgets();
  }, [pageId]);

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Custom Analytics
            </h1>
            <p className="text-muted-foreground mt-2">
              Create custom metrics and analytics using AI
            </p>
          </div>
          <div className="flex gap-2">
            <AIWidgetCreator onWidgetCreated={refreshWidgets} />
            <InteractiveAIWidgetCreator onWidgetCreated={refreshWidgets} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <GlassCard key={i} className="p-6 h-48 animate-pulse" />
            ))}
          </div>
        ) : widgets.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-semibold">No Custom Widgets Yet</h3>
              <p className="text-muted-foreground">
                Click "Create AI Widget" to start building custom analytics tailored to your trading strategy.
              </p>
              <p className="text-sm text-muted-foreground">
                Try prompts like: "Show my best performing setups" or "Compare brokers by profit"
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {widgets.map((widget) => (
              <CustomWidgetRenderer
                key={widget.id}
                widget={widget}
                onDelete={refreshWidgets}
                showAddToDashboard={true}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CustomPage;