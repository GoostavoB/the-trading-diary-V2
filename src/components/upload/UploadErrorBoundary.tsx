import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { uploadLogger } from '@/utils/uploadLogger';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class UploadErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to upload logger
    uploadLogger.log('error', 'ErrorBoundary', 'Upload component crashed', { error: error.message, componentStack: errorInfo.componentStack }, error);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/upload';
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-8 glass max-w-2xl mx-auto mt-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="rounded-full bg-destructive/10 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">Upload Error</h2>
              <p className="text-muted-foreground mb-4">
                Something went wrong during the upload process.
              </p>
              
              {this.state.error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 mb-4 text-left">
                  <p className="font-mono text-sm text-destructive break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>

            <details className="w-full">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Show technical details
              </summary>
              <div className="mt-4 bg-muted/50 rounded-lg p-4 text-left">
                <pre className="text-xs overflow-auto max-h-64 font-mono">
                  {this.state.errorInfo?.componentStack}
                </pre>
                <Button
                  onClick={() => {
                    const logs = uploadLogger.exportLogs();
                    const blob = new Blob([logs], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `upload-error-logs-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Download Error Logs
                </Button>
              </div>
            </details>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
