import { useMemo } from 'react';

export type WidgetDensity = 'spacious' | 'comfortable' | 'compact' | 'dense';

interface AdaptiveWidgetConfig {
  density: WidgetDensity;
  padding: string;
  gap: string;
  fontSize: {
    title: string;
    value: string;
    label: string;
  };
  minHeight: {
    small: string;
    medium: string;
    large: string;
  };
}

const DENSITY_CONFIG: Record<WidgetDensity, AdaptiveWidgetConfig> = {
  spacious: {
    density: 'spacious',
    padding: 'p-5',
    gap: 'gap-4',
    fontSize: {
      title: 'text-base',
      value: 'text-3xl',
      label: 'text-sm',
    },
    minHeight: {
      small: 'min-h-[140px]',
      medium: 'min-h-[200px]',
      large: 'min-h-[180px]',
    },
  },
  comfortable: {
    density: 'comfortable',
    padding: 'p-4',
    gap: 'gap-3',
    fontSize: {
      title: 'text-sm',
      value: 'text-2xl',
      label: 'text-xs',
    },
    minHeight: {
      small: 'min-h-[120px]',
      medium: 'min-h-[160px]',
      large: 'min-h-[140px]',
    },
  },
  compact: {
    density: 'compact',
    padding: 'p-3',
    gap: 'gap-2',
    fontSize: {
      title: 'text-xs',
      value: 'text-xl',
      label: 'text-[10px]',
    },
    minHeight: {
      small: 'min-h-[100px]',
      medium: 'min-h-[130px]',
      large: 'min-h-[110px]',
    },
  },
  dense: {
    density: 'dense',
    padding: 'p-2',
    gap: 'gap-1.5',
    fontSize: {
      title: 'text-[10px]',
      value: 'text-lg',
      label: 'text-[9px]',
    },
    minHeight: {
      small: 'min-h-[80px]',
      medium: 'min-h-[110px]',
      large: 'min-h-[90px]',
    },
  },
};

/**
 * Calculate widget density based on the number of visible widgets
 * More widgets = denser layout = smaller widgets
 */
export function calculateDensity(widgetCount: number): WidgetDensity {
  if (widgetCount <= 4) return 'spacious';
  if (widgetCount <= 8) return 'comfortable';
  if (widgetCount <= 12) return 'compact';
  return 'dense';
}

/**
 * Hook that provides adaptive widget sizing based on the total number of widgets
 * on the dashboard. As more widgets are added, everything becomes more compact.
 */
export function useAdaptiveWidgetSize(widgetCount: number) {
  const config = useMemo(() => {
    const density = calculateDensity(widgetCount);
    return DENSITY_CONFIG[density];
  }, [widgetCount]);

  return config;
}

/**
 * Get adaptive classes for a specific widget size category
 */
export function getAdaptiveClasses(
  widgetCount: number,
  sizeCategory: 'small' | 'medium' | 'large'
): string {
  const density = calculateDensity(widgetCount);
  const config = DENSITY_CONFIG[density];
  return `${config.padding} ${config.minHeight[sizeCategory]}`;
}

export { DENSITY_CONFIG };
