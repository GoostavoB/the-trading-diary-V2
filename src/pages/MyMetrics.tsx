import AppLayout from '@/components/layout/AppLayout';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, TrendingUp, Target, DollarSign, Percent } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { pageMeta } from '@/utils/seoHelpers';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MyMetrics = () => {
  const [metrics, setMetrics] = useState([
    { id: 1, name: 'Custom Win Rate', value: '68%', target: '70%', type: 'percentage' },
    { id: 2, name: 'Weekly Profit Target', value: '$1,200', target: '$1,500', type: 'currency' },
    { id: 3, name: 'Max Daily Trades', value: '8', target: '10', type: 'number' },
  ]);

  const [newMetric, setNewMetric] = useState({ name: '', target: '', type: 'percentage' });

  const handleAddMetric = () => {
    if (newMetric.name && newMetric.target) {
      setMetrics([...metrics, {
        id: Date.now(),
        name: newMetric.name,
        value: '-',
        target: newMetric.target,
        type: newMetric.type
      }]);
      setNewMetric({ name: '', target: '', type: 'percentage' });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'percentage': return Percent;
      case 'currency': return DollarSign;
      default: return Target;
    }
  };

  return (
    <>
      <SEO
        title={pageMeta.myMetrics.title}
        description={pageMeta.myMetrics.description}
        keywords={pageMeta.myMetrics.keywords}
        canonical={pageMeta.myMetrics.canonical}
        noindex={true}
      />
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Metrics</h1>
            <p className="text-muted-foreground">
              Create and track custom metrics that matter to your trading strategy
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Metric
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Custom Metric</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Metric Name</Label>
                  <Input
                    placeholder="e.g., Weekly Win Rate"
                    value={newMetric.name}
                    onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newMetric.type} onValueChange={(value) => setNewMetric({ ...newMetric, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input
                    placeholder="e.g., 75% or $5000"
                    value={newMetric.target}
                    onChange={(e) => setNewMetric({ ...newMetric, target: e.target.value })}
                  />
                </div>

                <Button onClick={handleAddMetric} className="w-full">
                  Create Metric
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const IconComponent = getIcon(metric.type);
            return (
              <PremiumCard key={metric.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
                <h3 className="font-semibold mb-2">{metric.name}</h3>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">Target: {metric.target}</span>
                  </div>
                </div>
              </PremiumCard>
            );
          })}
        </div>

        <PremiumCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Benchmark Comparison</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Your Win Rate vs Market Average</p>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">68%</span>
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-sm text-success">+5% vs avg</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Average Trade Duration</p>
                <p className="text-sm text-muted-foreground">Compared to your target</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">4.5h</span>
                <span className="text-sm text-muted-foreground">Target: 4h</span>
              </div>
            </div>
          </div>
        </PremiumCard>
      </div>
    </AppLayout>
    </>
  );
};

export default MyMetrics;
