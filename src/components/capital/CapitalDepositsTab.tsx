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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface CapitalLogEntry {
  id: string;
  log_date: string;
  amount_added: number;
  total_after: number;
  notes?: string;
}

export function CapitalDepositsTab() {
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

  const { data: capitalLog = [], isLoading } = useQuery({
    queryKey: ['capital-log', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('capital_log')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false });
      
      if (error) throw error;
      return data as CapitalLogEntry[];
    },
    enabled: !!user?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !amount) return;

      const amountNum = parseFloat(amount);
      let totalAfter = amountNum;

      if (!editingId) {
        const previousTotal = capitalLog.length > 0
          ? capitalLog.reduce((sum, entry) => sum + Number(entry.amount_added), 0)
          : 0;
        totalAfter = previousTotal + amountNum;
      } else {
        const editEntry = capitalLog.find(e => e.id === editingId);
        const otherTotal = capitalLog
          .filter(e => e.id !== editingId)
          .reduce((sum, entry) => sum + Number(entry.amount_added), 0);
        totalAfter = otherTotal + amountNum;
      }

      const payload = {
        user_id: user.id,
        log_date: date,
        amount_added: amountNum,
        total_after: totalAfter,
        notes: notes || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('capital_log')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('capital_log')
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-log'] });
      queryClient.invalidateQueries({ queryKey: ['capital-growth-data'] });
      handleClose();
      toast.success(editingId ? 'Deposit updated' : 'Deposit added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save deposit');
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['capital-growth-data'] });
      setDeleteId(null);
      toast.success('Deposit deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete deposit');
    },
  });

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setAmount('');
    setNotes('');
  };

  const handleEdit = (entry: CapitalLogEntry) => {
    setEditingId(entry.id);
    setDate(format(new Date(entry.log_date), 'yyyy-MM-dd'));
    setAmount(entry.amount_added.toString());
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Capital Deposits</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingId(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Deposit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Capital Deposit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Add any notes about this deposit..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {editingId ? 'Update' : 'Add'} Deposit
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
              <TableHead>Amount Added</TableHead>
              <TableHead>Total After</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading deposits...
                </TableCell>
              </TableRow>
            ) : capitalLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No deposits recorded yet. Add your first deposit above.
                </TableCell>
              </TableRow>
            ) : (
              capitalLog.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{format(new Date(entry.log_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-medium text-emerald-500">
                    +{formatCurrency(entry.amount_added)}
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
            <AlertDialogTitle>Delete Deposit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deposit? This action cannot be undone.
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
