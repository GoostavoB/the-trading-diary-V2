import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { isValidDecimal, parseDecimalInput } from "@/utils/numberFormatting";

export const QuickAddTrade = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    symbol: "",
    side: "long" as "long" | "short",
    entry_price: "",
    exit_price: "",
    position_size: "",
    profit_loss: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("trades").insert({
        user_id: user.id,
        symbol_temp: formData.symbol,
        side: formData.side,
        entry_price: parseDecimalInput(formData.entry_price),
        exit_price: parseDecimalInput(formData.exit_price),
        position_size: parseDecimalInput(formData.position_size),
        profit_loss: parseDecimalInput(formData.profit_loss),
        trade_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Trade added successfully!");
      setOpen(false);
      setFormData({
        symbol: "",
        side: "long",
        entry_price: "",
        exit_price: "",
        position_size: "",
        profit_loss: "",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to add trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:hidden"
        size="icon"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Add Trade</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="BTCUSDT"
                required
              />
            </div>

            <div>
              <Label htmlFor="side">Side</Label>
              <Select 
                value={formData.side} 
                onValueChange={(value: "long" | "short") => setFormData({ ...formData, side: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="entry">Entry Price</Label>
                <Input
                  id="entry"
                  type="text"
                  inputMode="decimal"
                  value={formData.entry_price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidDecimal(value)) {
                      setFormData({ ...formData, entry_price: value });
                    }
                  }}
                  required
                />
              </div>
              <div>
                <Label htmlFor="exit">Exit Price</Label>
                <Input
                  id="exit"
                  type="text"
                  inputMode="decimal"
                  value={formData.exit_price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isValidDecimal(value)) {
                      setFormData({ ...formData, exit_price: value });
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="size">Position Size</Label>
              <Input
                id="size"
                type="text"
                inputMode="decimal"
                value={formData.position_size}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isValidDecimal(value)) {
                    setFormData({ ...formData, position_size: value });
                  }
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="pnl">Profit/Loss</Label>
              <Input
                id="pnl"
                type="text"
                inputMode="decimal"
                value={formData.profit_loss}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isValidDecimal(value)) {
                    setFormData({ ...formData, profit_loss: value });
                  }
                }}
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                Add Trade
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
