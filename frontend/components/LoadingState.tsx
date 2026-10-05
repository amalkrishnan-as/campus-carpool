import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export function LoadingState({
  message = 'Loading...',
  minHeight = 'min-h-[250px]',
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${minHeight} text-slate-400`}>
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
