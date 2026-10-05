import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200">
      <AlertCircle className="w-10 h-10 text-rose-400 mb-3" />
      <h4 className="text-base font-semibold mb-1">{title}</h4>
      <p className="text-sm text-rose-300/80 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
