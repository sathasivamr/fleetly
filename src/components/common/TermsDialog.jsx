import { useState } from 'react';
import { api } from '@/lib/api';
import { useSession } from '@/context/SessionContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function TermsDialog({ open, termsUrl, onAccepted, onCancel }) {
  const { user, refresh } = useSession();
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await api.users.update(user.id, {
        ...user,
        attributes: { ...user.attributes, termsAccepted: true },
      });
      await refresh();
      onAccepted?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel?.()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Terms of service</DialogTitle>
          <DialogDescription>
            Your administrator requires you to accept the terms before continuing.
          </DialogDescription>
        </DialogHeader>
        {termsUrl && (
          <a
            href={termsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline"
          >
            Open terms document
          </a>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={accept} disabled={busy}>
            {busy ? 'Saving…' : 'I accept'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
