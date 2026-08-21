import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full bg-pos-bg flex items-center justify-center p-6 text-pos-text select-none">
          <Card className="max-w-lg w-full text-center p-8 border-pos-danger/30">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-pos-danger-bg flex items-center justify-center text-pos-danger text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-bold text-pos-text mb-2">POS Runtime Error</h1>
            <p className="text-sm text-pos-text-muted mb-6">
              An unexpected application error occurred. You can reload the terminal or
              reset the current view.
            </p>

            {this.state.error && (
              <div className="bg-pos-bg p-3 rounded-lg text-left text-xs font-mono text-pos-danger mb-6 overflow-auto max-h-36 border border-pos-border">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Try Again
              </Button>
              <Button variant="primary" onClick={this.handleReset}>
                Reload Application
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
