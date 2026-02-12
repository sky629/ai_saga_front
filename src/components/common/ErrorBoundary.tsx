import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
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
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="p-8 bg-black text-red-500 font-mono min-h-screen flex flex-col items-start justify-center overflow-auto">
                    <h1 className="text-4xl mb-4 font-bold border-b border-red-500 w-full pb-2">SYSTEM FAILURE</h1>
                    <div className="bg-red-900/10 p-4 border border-red-800 rounded w-full max-w-4xl">
                        <h2 className="text-xl mb-2">ERROR DETECTED</h2>
                        <p className="mb-4 text-red-400">{this.state.error?.toString()}</p>
                        <details className="whitespace-pre-wrap text-xs text-red-300/70">
                            <summary className="cursor-pointer mb-2 hover:text-red-300">STACK TRACE</summary>
                            {this.state.errorInfo?.componentStack}
                        </details>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-2 border border-red-500 hover:bg-red-500 hover:text-black transition-colors"
                    >
                        REBOOT SYSTEM
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
