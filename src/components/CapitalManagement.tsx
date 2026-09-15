import { useState } from 'react';
import { PremiumCard } from '@/components/ui/PremiumCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Calendar as CalendarIcon, TrendingUp, DollarSign, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BlurredCurrency } from '@/components/ui/BlurredValue';

interface CapitalLogEntry {
  id: string;
  log_date: string;
  amount_added: number;
  total_after: number;
  notes?: string;
}

export const CapitalManagement = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [amountAdded, setAmountAdded] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch capital log
  const { data: capitalLog = [], isLoading } = useQuery({
    queryKey: ['capital-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('capital_log')
        .select('*')
        .order('log_date', { ascending: false });

      if (error) throw error;
      return data as CapitalLogEntry[];
    },
  });

  // Add/Update capital entry
  const saveMutation = useMutation({
    mutationFn: async (entry: Partial<CapitalLogEntry>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate total_after
      const previousTotal = capitalLog.length > 0 && !editingId
        ? capitalLog[0].total_after
        : editingId
          ? capitalLog.find(e => e.id === editingId)?.total_after || 0
          : 0;

      const totalAfter = editingId
        ? parseFloat(amountAdded)
        : previousTotal + parseFloat(amountAdded);

      if (editingId) {
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
        const { error } = await supabase
          .from('capital_log')
          .insert({
            user_id: user.id,
            log_date: format(date, 'yyyy-MM-dd'),
            amount_added: parseFloat(amountAdded),
            total_after: totalAfter,
            notes: notes || null,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-log'] });
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
      queryClient.invalidateQueries({ queryKey: ['capital-log'] });
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

  const currentCapital = capitalLog.length > 0 ? capitalLog[0].total_after : 0;
  const totalAdded = capitalLog.reduce((sum, entry) => sum + entry.amount_added, 0);

  return (
    <PremiumCard className="p-6 glass-strong" data-tour="settings-capital">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            Capital Management
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Track capital additions for accurate ROI calculations
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Capital
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                  {editingId ? 'New Total Capital' : 'Amount Added'}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="e.g., Initial capital, Additional deposit, Profit transfer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Add'}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <PremiumCard className="p-4 glass">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Capital</p>
              <p className="text-2xl font-bold"><BlurredCurrency amount={currentCapital} /></p>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard className="p-4 glass">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Added</p>
              <p className="text-2xl font-bold"><BlurredCurrency amount={totalAdded} /></p>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Capital Log Table */}
      <div className="border rounded-lg glass">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount Added</TableHead>
              <TableHead>Total After</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : capitalLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No capital entries yet. Add your first entry to start tracking ROI accurately.
                </TableCell>
              </TableRow>
            ) : (
              capitalLog.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.log_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-medium text-accent">
                    +<BlurredCurrency amount={entry.amount_added} className="inline" />
                  </TableCell>
                  <TableCell className="font-semibold">
                    <BlurredCurrency amount={entry.total_after} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.notes || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(entry)}
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
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PremiumCard>
  );
};
