import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

type LazyModule = { default: ComponentType };

const wait = (delayMs: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, delayMs));

/**
 * Retries a failed route chunk once before passing the error to the app-level
 * ErrorBoundary, which renders the visible reload/dashboard recovery screen.
 */
export const lazyWithRetry = (
  importer: () => Promise<LazyModule>,
  retryDelayMs = 500,
): LazyExoticComponent<ComponentType> =>
  lazy(async () => {
    try {
      return await importer();
    } catch (firstError) {
      console.warn('Route chunk failed to load; retrying once.', firstError);
      await wait(retryDelayMs);
      return importer();
    }
  });