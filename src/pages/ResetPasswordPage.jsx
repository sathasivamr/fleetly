import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useFlash } from '@/context/FlashContext';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('passwordReset');
  const { showSuccess, showError } = useFlash();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (!token) {
        await api.password.reset(email);
        showSuccess('If the email exists, reset instructions were sent.');
      } else {
        await api.password.update(token, password);
        showSuccess('Password updated — sign in with the new password.');
      }
    } catch (err) {
      showError(err.message || 'Request failed');
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
        <h1 className="text-2xl font-semibold">{token ? 'Set new password' : 'Reset password'}</h1>
        {!token ? (
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        ) : (
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Please wait…' : token ? 'Update password' : 'Send reset link'}
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
