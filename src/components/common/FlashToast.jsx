import { X } from 'lucide-react';
import { useFlash } from '@/context/FlashContext';
import { cn } from '@/lib/utils';

export default function FlashToast() {
  const { toast, dismiss } = useFlash();
  if (!toast) return null;

  return (
    <div
      className={cn(
        'pointer-events-auto fixed bottom-4 right-4 z-[100] flex max-w-md items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
        toast.type === 'error'
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-border bg-card text-foreground',
      )}
      role="alert"
    >
      <p className="flex-1 text-sm">{toast.message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="rounded p-0.5 hover:bg-background/50"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
