import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useFlash } from '@/context/FlashContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useFlash();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpKey, setTotpKey] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const server = await api.session.server();
        if (cancelled || !server?.attributes?.totpForce) return;
        const k = await api.users.totpSetup();
        if (!cancelled) setTotpKey(typeof k === 'string' ? k : null);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.users.register({ name, email, password, totpKey });
      showSuccess('Account created — you can sign in now.');
      navigate('/login', { replace: true });
    } catch (err) {
      showError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="mb-8 flex items-center gap-2">
        <Truck className="h-8 w-8 text-primary" />
        <span className="text-xl font-semibold">Fleetly</span>
      </div>
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Register</h1>
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {totpKey && (
          <p className="text-xs text-muted-foreground">Authenticator setup may be required by server.</p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </Button>
        <p className="text-center text-sm">
          <Link to="/login" className="text-primary underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
