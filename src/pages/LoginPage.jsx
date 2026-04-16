import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/context/SessionContext';

export default function LoginPage() {
  const { login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password, codeEnabled ? code : undefined);
      const to = location.state?.from?.pathname || '/dashboard';
      navigate(to, { replace: true });
    } catch (err) {
      if (err.needsTotp) {
        setCodeEnabled(true);
        setError('Enter the code from your authenticator app.');
      } else {
        setError(err.message || 'Sign-in failed');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/70 p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Truck className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Fleetly</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            Operate your fleet like a product.
          </h1>
          <p className="mt-3 max-w-md text-primary-foreground/80">
            Real-time tracking, maintenance workflows, and driver safety — unified on a modern
            platform built for ops teams.
          </p>
        </div>
        <div className="text-xs text-primary-foreground/70">
          Fleet OS · Powered by Traccar
        </div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <div className="mb-6 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Truck className="h-4 w-4" />
              </div>
              <span className="font-semibold">Fleetly</span>
            </div>
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your Traccar server account (same as the classic web UI).
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {codeEnabled && (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Authenticator code</span>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
              />
            </label>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/register" className="text-primary underline">
              Register
            </Link>
            {' · '}
            <Link to="/reset-password" className="text-primary underline">
              Reset password
            </Link>
            {' · '}
            <Link to="/change-server" className="text-primary underline">
              Change server
            </Link>
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Configure <code className="rounded bg-muted px-1">VITE_TRACCAR_URL</code> in{' '}
            <code className="rounded bg-muted px-1">.env.local</code> to point at your server.
          </p>
        </form>
      </div>
    </div>
  );
}
