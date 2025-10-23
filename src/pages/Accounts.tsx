import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Plus, Edit, Trash2, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatNumber";
import { BlurredCurrency, BlurredPercent } from "@/components/ui/BlurredValue";
import { BlurToggleButton } from "@/components/ui/BlurToggleButton";

interface TradingAccount {
  id: string;
  account_name: string;
  broker: string;
  account_type: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  account_number: string | null;
  notes: string | null;
  created_at: string;
}

const Accounts = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  const [formData, setFormData] = useState({
    account_name: "",
    broker: "",
    account_type: "live",
    currency: "USD",
    initial_balance: "0",
    current_balance: "0",
    account_number: "",
    notes: "",
    is_active: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["trading-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trading_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TradingAccount[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("trading_accounts").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-accounts"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Account Created",
        description: "Trading account has been created successfully.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("trading_accounts")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-accounts"] });
      setIsDialogOpen(false);
      setEditingAccount(null);
      resetForm();
      toast({
        title: "Account Updated",
        description: "Trading account has been updated successfully.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trading_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trading-accounts"] });
      toast({
        title: "Account Deleted",
        description: "Trading account has been deleted successfully.",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      account_name: "",
      broker: "",
      account_type: "live",
      currency: "USD",
      initial_balance: "0",
      current_balance: "0",
      account_number: "",
      notes: "",
      is_active: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      initial_balance: parseFloat(formData.initial_balance) || 0,
      current_balance: parseFloat(formData.current_balance) || 0,
    };

    if (editingAccount) {
      updateMutation.mutate({ id: editingAccount.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (account: TradingAccount) => {
    setEditingAccount(account);
    setFormData({
      account_name: account.account_name,
      broker: account.broker,
      account_type: account.account_type,
      currency: account.currency,
      initial_balance: account.initial_balance.toString(),
      current_balance: account.current_balance.toString(),
      account_number: account.account_number || "",
      notes: account.notes || "",
      is_active: account.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      deleteMutation.mutate(id);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);
  const totalPnL = accounts.reduce((sum, acc) => sum + (acc.current_balance - acc.initial_balance), 0);
  const activeAccounts = accounts.filter(acc => acc.is_active).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground">Trading Accounts</h1>
            <p className="text-muted-foreground mt-2">
              Manage your trading accounts across different brokers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BlurToggleButton />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={() => { setEditingAccount(null); resetForm(); }}>
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingAccount ? "Edit Account" : "Create New Account"}</DialogTitle>
                  <DialogDescription>
                    {editingAccount ? "Update your trading account details" : "Add a new trading account to track"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Name *</Label>
                      <Input
                        id="account_name"
                        value={formData.account_name}
                        onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                        placeholder="Main Trading Account"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="broker">Broker *</Label>
                      <Input
                        id="broker"
                        value={formData.broker}
                        onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                        placeholder="Binance, Bybit, etc."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="account_type">Account Type</Label>
                      <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="live">Live</SelectItem>
                          <SelectItem value="demo">Demo</SelectItem>
                          <SelectItem value="paper">Paper Trading</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="initial_balance">Initial Balance</Label>
                      <Input
                        id="initial_balance"
                        type="number"
                        step="0.01"
                        value={formData.initial_balance}
                        onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_balance">Current Balance</Label>
                      <Input
                        id="current_balance"
                        type="number"
                        step="0.01"
                        value={formData.current_balance}
                        onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account_number">Account Number (Optional)</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="Account or ID number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional details about this account..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active Account</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingAccount ? "Update Account" : "Create Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <BlurredCurrency amount={totalBalance} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPnL >= 0 ? "text-neon-green" : "text-neon-red"}`}>
                <BlurredCurrency amount={totalPnL} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Combined profit/loss
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAccounts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {accounts.length} total
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const pnl = account.current_balance - account.initial_balance;
            const pnlPercent = account.initial_balance > 0 
              ? ((pnl / account.initial_balance) * 100).toFixed(2)
              : "0.00";

            return (
              <Card key={account.id} className={!account.is_active ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{account.account_name}</CardTitle>
                      <CardDescription>{account.broker}</CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(account)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(account.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={account.account_type === "live" ? "default" : "secondary"}>
                      {account.account_type}
                    </Badge>
                    <Badge variant="outline">{account.currency}</Badge>
                    {!account.is_active && <Badge variant="destructive">Inactive</Badge>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Balance</span>
                      <span className="font-medium">
                        <BlurredCurrency amount={account.current_balance} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Initial Balance</span>
                      <span>
                        <BlurredCurrency amount={account.initial_balance} />
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">P&L</span>
                      <span className={pnl >= 0 ? "text-neon-green" : "text-neon-red"}>
                        <BlurredCurrency amount={pnl} /> (<BlurredPercent value={parseFloat(pnlPercent)} />)
                      </span>
                    </div>
                  </div>

                  {account.account_number && (
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Account: {account.account_number}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {accounts.length === 0 && !isLoading && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trading Accounts</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by adding your first trading account
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default Accounts;
