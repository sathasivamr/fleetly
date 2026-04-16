import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useSession } from '@/context/SessionContext';
import { useFlash } from '@/context/FlashContext';

export default function PreferencesSettingsPage() {
  const { user, refresh } = useSession();
  const { showError, showSuccess } = useFlash();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const u = await api.users.get(user.id);
        if (!cancelled) setText(JSON.stringify(u, null, 2));
      } catch (e) {
        if (!cancelled) showError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = JSON.parse(text);
      await api.users.update(user.id, payload);
      await refresh();
      showSuccess('Saved');
    } catch (e) {
      showError(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Preferences" description="Your user record (PUT /api/users/:id)." />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[360px] font-mono text-xs"
            spellCheck={false}
          />
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      )}
    </div>
  );
}
