import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import EmptyState from '@/components/common/EmptyState';
import { useFlash } from '@/context/FlashContext';

export default function ServerSettingsPage() {
  const { administrator } = usePermissions();
  const { showError, showSuccess } = useFlash();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!administrator) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const s = await api.server.get();
        if (!cancelled) setText(JSON.stringify(s, null, 2));
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
  }, [administrator]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = JSON.parse(text);
      await api.server.update(payload);
      showSuccess('Server settings saved');
    } catch (e) {
      showError(e.message || 'Invalid JSON or save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!administrator) {
    return <EmptyState title="Administrators only" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Server" description="PUT /api/server — same payload as classic Traccar UI." />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[320px] font-mono text-xs"
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
