import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import EmptyState from '@/components/common/EmptyState';
import { useFlash } from '@/context/FlashContext';

export default function PermissionsSettingsPage() {
  const { administrator } = usePermissions();
  const { showError, showSuccess } = useFlash();
  const [text, setText] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!administrator) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoadError(null);
    (async () => {
      try {
        const list = await api.permissions.list();
        if (!cancelled) setText(JSON.stringify(list, null, 2));
      } catch (e) {
        if (!cancelled) setLoadError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [administrator]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = JSON.parse(text);
      await api.permissions.update(payload);
      showSuccess('Permissions saved');
    } catch (e) {
      if (e instanceof SyntaxError) {
        showError('Invalid JSON');
      } else {
        showError(e.message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!administrator) {
    return <EmptyState title="Administrators only" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="PUT /api/permissions — user/device/group links (same payload shape as Traccar)"
        actions={
          <Button type="button" onClick={save} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        }
      />
      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[480px] font-mono text-xs"
              spellCheck={false}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
