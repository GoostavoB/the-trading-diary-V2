import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WithdrawalEntry {
  id: string;
  withdrawal_date: string;
  amount_withdrawn: number;
  total_after: number;
  notes?: string;
}

export function CapitalWithdrawalsTab() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ['withdrawals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('withdrawal_log')
        .select('*')
        .eq('user_id', user.id)
        .order('withdrawal_date', { ascending: false });
      
      if (error) throw error;
      return data as WithdrawalEntry[];
    },
    enabled: !!user?.id,
  });

  // Calculate available margin
  const { data: availableMargin } = useQuery({
    queryKey: ['available-margin', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data: deposits } = await supabase
        .from('capital_log')
        .select('amount_added')
        .eq('user_id', user.id);

      const { data: trades } = await supabase
        .from('trades')
        .select('profit_loss')
        .eq('user_id', user.id)
        .not('closed_at', 'is', null);

      const { data: withdrawals } = await supabase
        .from('withdrawal_log')
        .select('amount_withdrawn')
        .eq('user_id', user.id);

      const totalDeposits = deposits?.reduce((sum, d) => sum + Number(d.amount_added || 0), 0) || 0;
      const totalPnL = trades?.reduce((sum, t) => sum + Number(t.profit_loss || 0), 0) || 0;
      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.amount_withdrawn || 0), 0) || 0;

      return totalDeposits + totalPnL - totalWithdrawals;
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !amount) return;

      const amountNum = parseFloat(amount);
      
      // Check if withdrawal exceeds available margin (only for new withdrawals)
      if (!editingId && availableMargin !== undefined && amountNum > availableMargin) {
        throw new Error(`Withdrawal amount exceeds available margin of ${formatCurrency(availableMargin)}`);
      }

      const totalAfter = availableMargin !== undefined ? availableMargin - amountNum : 0;

      const payload = {
        user_id: user.id,
        withdrawal_date: date,
        amount_withdrawn: amountNum,
        total_after: totalAfter,
        notes: notes || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('withdrawal_log')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('withdrawal_log')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['available-margin'] });
      queryClient.invalidateQueries({ queryKey: ['capital-growth-data'] });
      handleClose();
      toast.success(editingId ? 'Withdrawal updated' : 'Withdrawal recorded');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save withdrawal');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('withdrawal_log')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['available-margin'] });
      queryClient.invalidateQueries({ queryKey: ['capital-growth-data'] });
      setDeleteId(null);
      toast.success('Withdrawal deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete withdrawal');
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setAmount('');
    setNotes('');
  };

  const handleEdit = (entry: WithdrawalEntry) => {
    setEditingId(entry.id);
    setDate(format(new Date(entry.withdrawal_date), 'yyyy-MM-dd'));
    setAmount(entry.amount_withdrawn.toString());
    setNotes(entry.notes || '');
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    saveMutation.mutate();
  };

  const willExceedMargin = amount && !editingId && availableMargin !== undefined
    ? parseFloat(amount) > availableMargin
    : false;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Capital Withdrawals</h3>
          <p className="text-sm text-muted-foreground">
            Available margin: {formatCurrency(availableMargin || 0)}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Withdrawal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Record'} Withdrawal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {willExceedMargin && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This withdrawal exceeds your available margin of {formatCurrency(availableMargin || 0)}
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this withdrawal..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saveMutation.isPending || willExceedMargin}
                >
                  {editingId ? 'Update' : 'Record'} Withdrawal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount Withdrawn</TableHead>
              <TableHead>Balance After</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading withdrawals...
                </TableCell>
              </TableRow>
            ) : withdrawals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No withdrawals recorded yet. Add your first withdrawal above.
                </TableCell>
              </TableRow>
            ) : (
              withdrawals.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.withdrawal_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-medium text-rose-500">
                    -{formatCurrency(entry.amount_withdrawn)}
                  </TableCell>
                  <TableCell>{formatCurrency(entry.total_after)}</TableCell>
                  <TableCell className="text-muted-foreground">{entry.notes || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Withdrawal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this withdrawal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
