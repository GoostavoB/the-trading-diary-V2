import { WidgetPosition } from '@/hooks/useGridLayout';
import { ReactNode, useEffect, useState } from 'react';

interface AdaptiveGridProps {
  positions: WidgetPosition[];
  order: string[];
  columnCount: number;
  isCustomizing: boolean;
  renderWidget: (widgetId: string) => ReactNode;
  onOpenWidgetLibrary?: () => void;
  mode?: 'adaptive' | 'fixed';
}

export const AdaptiveGrid = ({
  positions,
  order,
  columnCount,
  isCustomizing,
  renderWidget,
  onOpenWidgetLibrary,
  mode = 'adaptive',
}: AdaptiveGridProps) => {
  const [responsiveColumns, setResponsiveColumns] = useState(columnCount);

  // Responsive column calculation
  useEffect(() => {
    console.log('[AdaptiveGrid] 📐 Grid Render:', {
      columnCount,
      positionCount: positions.length,
      orderCount: order.length,
      isCustomizing
    });

    const updateColumns = () => {
      const width = window.innerWidth;
      let cols = columnCount;
      if (width < 768) {
        cols = 2; // Mobile: 2 subcolumns (1 full column)
      } else if (width < 1280) {
        cols = 4; // Tablet: 4 subcolumns (2 full columns)
      } else {
        cols = Math.min(columnCount, 4) * 2; // Desktop: user preference * 2 subcolumns
      }
      console.log('[AdaptiveGrid] 📱 Responsive columns:', { width, cols });
      setResponsiveColumns(cols);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, [columnCount, positions.length, order.length, isCustomizing]);

  console.log('[AdaptiveGrid] 🌊 Rendering Adaptive Grid:', { responsiveColumns, widgetCount: order.length });
  // Adaptive mode: responsive flowing grid with dense packing
  return (
    <div
      className="grid gap-4 auto-rows-auto transition-all duration-500 ease-out"
      style={{
        gridTemplateColumns: `repeat(${responsiveColumns}, minmax(0, 1fr))`,
        gridAutoFlow: 'dense',
      }}
    >
      {order.map((widgetId, index) => (
        <div
          key={widgetId}
          className="animate-fade-in"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: 'backwards',
          }}
        >
          {renderWidget(widgetId)}
        </div>
      ))}
    </div>
  );
};
