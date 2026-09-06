import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Rendered instead of the children when they throw. Defaults to nothing. */
  fallback?: ReactNode;
  label?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Silent, local error boundary.
 *
 * Wraps a non-critical widget so that any render/runtime failure inside it
 * stays contained and can never take down the surrounding layout or block
 * navigation to other routes.
 */
export class SafeBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`SafeBoundary${this.props.label ? ` (${this.props.label})` : ''}:`, error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
