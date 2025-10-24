/**
 * Leverage & Stop Calculator Widget
 * Export for easy integration and embedding
 */

export { LeverageStopWidget } from './LeverageStopWidget';
export { MiniChart } from './MiniChart';
export { RiskGauge } from './RiskGauge';
export { QuickSimulation } from './QuickSimulation';

/**
 * Initialize widget for non-React embeds
 * Usage: initLeverageStopWidget(document.getElementById('widget'), { defaultSide: 'long' })
 */
export function initLeverageStopWidget(
  targetElement: HTMLElement,
  props: any = {}
): void {
  if (typeof window === 'undefined') return;
  
  // Dynamic import to avoid SSR issues
  import('react').then(React => {
    import('react-dom/client').then(ReactDOM => {
      import('./LeverageStopWidget').then(({ LeverageStopWidget }) => {
        const root = ReactDOM.createRoot(targetElement);
        root.render(React.createElement(LeverageStopWidget, props));
      });
    });
  });
}
