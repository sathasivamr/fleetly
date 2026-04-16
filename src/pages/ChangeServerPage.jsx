import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFlash } from '@/context/FlashContext';

const PRESETS = [
  'https://demo.traccar.org',
  'https://demo2.traccar.org',
  'https://demo3.traccar.org',
  'https://demo4.traccar.org',
  'http://localhost:8082',
];

const STORAGE_KEY = 'fleet-traccar-url-hint';

export default function ChangeServerPage() {
  const { showSuccess } = useFlash();
  const [url, setUrl] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || PRESETS[0];
    } catch {
      return PRESETS[0];
    }
  });

  const save = () => {
    try {
      new URL(url);
    } catch {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, url);
    } catch {
      /* ignore */
    }
    showSuccess('Saved. Set VITE_TRACCAR_URL in .env to this URL and restart the dev server.');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-8 flex items-center gap-2">
        <Truck className="h-8 w-8 text-primary" />
        <span className="text-xl font-semibold">Fleetly</span>
      </div>
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Backend server</h1>
        <p className="text-sm text-muted-foreground">
          The dev app proxies <code className="rounded bg-muted px-1">/api</code> to{' '}
          <code className="rounded bg-muted px-1">VITE_TRACCAR_URL</code> from{' '}
          <code className="rounded bg-muted px-1">.env</code>. Store your preferred URL here as a
          reminder, then align <code className="rounded bg-muted px-1">.env</code> and restart{' '}
          <code className="rounded bg-muted px-1">npm run dev</code>.
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p} type="button" variant="outline" size="sm" onClick={() => setUrl(p)}>
              {p.replace('https://', '')}
            </Button>
          ))}
        </div>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        <Button type="button" className="w-full" onClick={save}>
          Save preference
        </Button>
        <p className="text-center text-sm">
          <Link to="/login" className="text-primary underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
