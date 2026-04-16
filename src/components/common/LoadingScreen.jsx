import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}
