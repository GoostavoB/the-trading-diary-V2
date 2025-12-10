import { useState } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar as CalendarIcon, TrendingUp, DollarSign, Edit, Trash2, ArrowLeft, History } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BlurredCurrency } from '@/components/ui/BlurredValue';
import AppLayout from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { useSubAccount } from '@/contexts/SubAccountContext';

interface CapitalLogEntry {
  id: string;
  log_date: string;
  amount_added: number;
  total_after: number;
  notes?: string;
  created_at: string;
  sub_account_id?: string | null;
}

const CapitalManagementPage = () => {

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeSubAccount } = useSubAccount();
  const activeSubAccountId = activeSubAccount?.id || null;
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [amountAdded, setAmountAdded] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch capital log - include entries for this sub-account or entries with no sub-account
  const { data: capitalLog = [], isLoading } = useQuery({
    queryKey: ['capital-log', activeSubAccountId],
    queryFn: async () => {
      let query = supabase
        .from('capital_log')
        .select('*');

      if (activeSubAccountId) {
        query = query.or(`sub_account_id.eq.${activeSubAccountId},sub_account_id.is.null`);
      }

      const { data, error } = await query.order('log_date', { ascending: true });

      if (error) throw error;
      return data as CapitalLogEntry[];
    },
  });

  // Add/Update capital entry
  const saveMutation = useMutation({
    mutationFn: async (entry: Partial<CapitalLogEntry>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate total_after based on chronological order
      const sortedLog = [...capitalLog].sort((a, b) =>
        new Date(a.log_date).getTime() - new Date(b.log_date).getTime()
      );

      if (editingId) {
        // When editing, recalculate all entries after this one
        const editIndex = sortedLog.findIndex(e => e.id === editingId);
        const previousTotal = editIndex > 0 ? sortedLog[editIndex - 1].total_after : 0;
        const totalAfter = previousTotal + parseFloat(amountAdded);

        const { error } = await supabase
          .from('capital_log')
          .update({
            log_date: format(date, 'yyyy-MM-dd'),
            amount_added: parseFloat(amountAdded),
            total_after: totalAfter,
            notes: notes || null,
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // When adding new, calculate based on last entry
        const previousTotal = sortedLog.length > 0
          ? sortedLog[sortedLog.length - 1].total_after
          : 0;
        const totalAfter = previousTotal + parseFloat(amountAdded);

        const { error } = await supabase
          .from('capital_log')
          .insert({
            user_id: user.id,
            log_date: format(date, 'yyyy-MM-dd'),
            amount_added: parseFloat(amountAdded),
            total_after: totalAfter,
            notes: notes || null,
            sub_account_id: activeSubAccountId,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-log', activeSubAccountId] });
      toast.success(editingId ? 'Capital entry updated' : 'Capital entry added');
      handleClose();
    },
    onError: (error) => {
      toast.error(`Failed to save capital entry: ${error.message}`);
    },
  });

  // Delete capital entry
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('capital_log')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-log', activeSubAccountId] });
      toast.success('Capital entry deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setEditingId(null);
    setAmountAdded('');
    setNotes('');
    setDate(new Date());
  };

  const handleEdit = (entry: CapitalLogEntry) => {
    setEditingId(entry.id);
    setDate(new Date(entry.log_date));
    setAmountAdded(entry.amount_added.toString());
    setNotes(entry.notes || '');
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amountAdded || parseFloat(amountAdded) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    saveMutation.mutate({});
  };

  const currentCapital = capitalLog.length > 0
    ? capitalLog[capitalLog.length - 1].total_after
    : 0;
  const totalAdded = capitalLog.reduce((sum, entry) => sum + entry.amount_added, 0);
  const averageAddition = capitalLog.length > 0 ? totalAdded / capitalLog.length : 0;

  return (
    <AppLayout>
      <SEO
        title='Capital Management - TradeWise'
        description='Track and manage your trading capital additions for accurate ROI calculations'
      />
      <main className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-accent" />
                Capital Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your capital additions for accurate ROI calculations
              </p>
            </div>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-5 w-5" />
                Add Capital Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Capital Entry' : 'Add Capital Entry'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => d && setDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount Added
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountAdded}
                    onChange={(e) => setAmountAdded(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the amount of capital you're adding to your trading account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., Initial capital, Monthly deposit, Profit transfer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={saveMutation.isPending} className="flex-1">
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Update Entry' : 'Add Entry'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PremiumCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Current Capital</p>
                <p className="text-3xl font-bold mt-1">
                  <BlurredCurrency amount={currentCapital} />
                </p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Added</p>
                <p className="text-3xl font-bold mt-1">
                  <BlurredCurrency amount={totalAdded} />
                </p>
              </div>
            </div>
          </PremiumCard>

          <PremiumCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5">
                <History className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Average Addition</p>
                <p className="text-3xl font-bold mt-1">
                  <BlurredCurrency amount={averageAddition} />
                </p>
              </div>
            </div>
          </PremiumCard>
        </div>

        {/* Visual Timeline */}
        {capitalLog.length > 0 && (
          <PremiumCard className="p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <History className="h-5 w-5" />
              Capital Timeline
            </h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-primary to-accent/20" />

              {/* Timeline entries */}
              <div className="space-y-6">
                {capitalLog.map((entry, index) => (
                  <div key={entry.id} className="relative flex gap-6 group">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg">
                        <DollarSign className="h-7 w-7 text-white" />
                      </div>
                      {index === capitalLog.length - 1 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-pulse" />
                      )}
                    </div>

                    {/* Content */}
                    <PremiumCard className="flex-1 p-5 hover:bg-muted/10 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-lg font-semibold">
                              {format(new Date(entry.log_date), 'MMMM dd, yyyy')}
                            </p>
                            {index === capitalLog.length - 1 && (
                              <Badge className="bg-accent text-white">Latest</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Amount Added</p>
                              <p className="text-2xl font-bold text-accent">
                                +<BlurredCurrency amount={entry.amount_added} className="inline" />
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Capital</p>
                              <p className="text-2xl font-bold">
                                <BlurredCurrency amount={entry.total_after} />
                              </p>
                            </div>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                              {entry.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                            className="rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this capital entry? This will affect your ROI calculations.')) {
                                deleteMutation.mutate(entry.id);
                              }
                            }}
                            className="rounded-full hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </PremiumCard>
                  </div>
                ))}
              </div>
            </div>
          </PremiumCard>
        )}

        {/* Empty State */}
        {capitalLog.length === 0 && !isLoading && (
          <PremiumCard className="p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
                <DollarSign className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-2xl font-semibold">Start Tracking Your Capital</h3>
              <p className="text-muted-foreground">
                Add your first capital entry to start tracking your trading capital additions and get accurate ROI calculations.
              </p>
              <Button
                onClick={() => setIsOpen(true)}
                className="gap-2 mt-4"
                size="lg"
              >
                <Plus className="h-5 w-5" />
                Add First Entry
              </Button>
            </div>
          </PremiumCard>
        )}

        {/* Loading State */}
        {isLoading && (
          <PremiumCard className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading capital entries...</p>
          </PremiumCard>
        )}

        {/* Detailed Table */}
        {capitalLog.length > 0 && (
          <PremiumCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Table className="h-5 w-5" />
              All Entries
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Date</TableHead>
                    <TableHead>Amount Added</TableHead>
                    <TableHead>Total After</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...capitalLog].reverse().map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {format(new Date(entry.log_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-semibold text-accent">
                        +<BlurredCurrency amount={entry.amount_added} className="inline" />
                      </TableCell>
                      <TableCell className="font-bold">
                        <BlurredCurrency amount={entry.total_after} />
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {entry.notes || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(entry)}
                            className="rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm('Delete this capital entry?')) {
                                deleteMutation.mutate(entry.id);
                              }
                            }}
                            className="rounded-full hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PremiumCard>
        )}
      </main>
    </AppLayout>
  );
};

export default CapitalManagementPage;