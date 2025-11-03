import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X } from "lucide-react";

interface PlanComparisonModalProps {
  open: boolean;
  onClose: () => void;
}

export const PlanComparisonModal = ({ open, onClose }: PlanComparisonModalProps) => {
  const features = [
    {
      category: "Credits & Uploads",
      items: [
        { name: "Monthly upload credits", free: "0", pro: "30", elite: "150" },
        { name: "One-time gift credits", free: "5", pro: "0", elite: "0" },
        { name: "Extra credit pricing", free: "$0.50/credit", pro: "$0.20/credit", elite: "$0.20/credit" },
        { name: "Credits never expire", free: true, pro: true, elite: true },
      ]
    },
    {
      category: "Features",
      items: [
        { name: "AI trade extraction", free: true, pro: true, elite: true },
        { name: "Manual entry", free: true, pro: true, elite: true },
        { name: "Basic analytics", free: true, pro: true, elite: true },
        { name: "Custom themes", free: false, pro: true, elite: true },
        { name: "Premium widgets", free: false, pro: true, elite: true },
        { name: "Premium analytics", free: false, pro: true, elite: true },
        { name: "XP progression", free: "Basic", pro: "Enhanced", elite: "Enhanced" },
      ]
    },
    {
      category: "Support & Access",
      items: [
        { name: "Email support", free: true, pro: true, elite: true },
        { name: "Priority support", free: false, pro: false, elite: true },
        { name: "Early feature access", free: false, pro: false, elite: true },
      ]
    }
  ];

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detailed Plan Comparison</DialogTitle>
          <DialogDescription>
            Compare features across all plans to find the best fit for your needs.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-4 px-4 font-semibold">Feature</th>
                <th className="text-center py-4 px-4 font-semibold">Free</th>
                <th className="text-center py-4 px-4 font-semibold text-primary">Pro</th>
                <th className="text-center py-4 px-4 font-semibold text-amber-600">Elite</th>
              </tr>
            </thead>
            <tbody>
              {features.map((category, categoryIndex) => (
                <>
                  <tr key={`category-${categoryIndex}`} className="bg-secondary/30">
                    <td colSpan={4} className="py-2 px-4 font-semibold text-sm">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, itemIndex) => (
                    <tr key={`${categoryIndex}-${itemIndex}`} className="border-b">
                      <td className="py-3 px-4 text-sm">{item.name}</td>
                      <td className="py-3 px-4 text-center">{renderCell(item.free)}</td>
                      <td className="py-3 px-4 text-center">{renderCell(item.pro)}</td>
                      <td className="py-3 px-4 text-center">{renderCell(item.elite)}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
