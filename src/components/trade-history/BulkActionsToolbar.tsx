import { Trash2, Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BulkActionsToolbarProps {
  selectedCount: number;
  hasDeletedTrades: boolean;
  onBulkDelete: () => void;
  onBulkUndelete: () => void;
  onClearSelection: () => void;
}

export const BulkActionsToolbar = ({
  selectedCount,
  hasDeletedTrades,
  onBulkDelete,
  onBulkUndelete,
  onClearSelection,
}: BulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
      <Badge variant="secondary">{selectedCount} selected</Badge>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Selected
        </Button>
        {hasDeletedTrades && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkUndelete}
          >
            <Undo className="h-4 w-4 mr-2" />
            Restore Selected
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
};
