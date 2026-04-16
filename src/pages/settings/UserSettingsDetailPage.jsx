import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useSession } from '@/context/SessionContext';
import { usePermissions } from '@/hooks/usePermissions';
import EmptyState from '@/components/common/EmptyState';
import { useFlash } from '@/context/FlashContext';

export default function UserSettingsDetailPage() {
  const { id } = useParams();
  const { user: sessionUser } = useSession();
  const { administrator, manager } = usePermissions();
  const { showError, showSuccess } = useFlash();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const numericId = Number(id);
  const canEdit =
    administrator || manager || (sessionUser?.id != null && Number(sessionUser.id) === numericId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await api.users.get(id);
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
  }, [id]);

  const save = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const payload = JSON.parse(text);
      await api.users.update(id, payload);
      showSuccess('User saved');
    } catch (e) {
      showError(e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  if (!administrator && !manager && Number(sessionUser?.id) !== numericId) {
    return <EmptyState title="Access denied" />;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/settings/users">← Users</Link>
      </Button>
      <PageHeader title="User" description={`PUT /api/users/${id}`} />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!canEdit}
            className="min-h-[360px] font-mono text-xs"
            spellCheck={false}
          />
          {canEdit && (
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
