import { useDroppable } from '@dnd-kit/core';
import { memo } from 'react';

interface DropZoneProps {
  id: string;
}

export const DropZone = memo(({ id }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      aria-label="Drop here"
      className={
        `min-h-6 rounded-md border border-dashed transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-border/60'
        }`
      }
    />
  );
});

DropZone.displayName = 'DropZone';
