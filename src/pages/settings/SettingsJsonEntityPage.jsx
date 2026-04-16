import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useFlash } from '@/context/FlashContext';
import EmptyState from '@/components/common/EmptyState';

const LABELS = {
  notifications: { title: 'Notification', base: '/settings/notifications' },
  commands: { title: 'Saved command', base: '/settings/commands' },
  calendars: { title: 'Calendar', base: '/settings/calendars' },
  computed: { title: 'Computed attribute', base: '/settings/attributes' },
  scheduled: { title: 'Scheduled report', base: '/reports/scheduled' },
};

const DEFAULT_JSON = {
  notifications: { type: 'alarm', always: false, notificators: 'web' },
  commands: { type: 'custom', description: 'New command' },
  calendars: { name: 'New calendar' },
  computed: { description: 'New rule', expression: '0', attribute: 'computed' },
  scheduled: { type: 'events', description: 'New scheduled report' },
};

function getClient(kind) {
  switch (kind) {
    case 'notifications':
      return api.notifications;
    case 'commands':
      return api.commands;
    case 'calendars':
      return api.calendars;
    case 'computed':
      return api.computedAttributes;
    case 'scheduled':
      return api.scheduledReports;
    default:
      return null;
  }
}

export default function SettingsJsonEntityPage() {
  const { kind, id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useFlash();
  const [text, setText] = useState('{}');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const meta = LABELS[kind];
  const client = getClient(kind);
  const isNew = id === 'new';

  useEffect(() => {
    if (!client || !meta) {
      setLoading(false);
      return undefined;
    }
    if (isNew) {
      setText(JSON.stringify(DEFAULT_JSON[kind] || {}, null, 2));
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const entity = await client.get(id);
        if (!cancelled) setText(JSON.stringify(entity, null, 2));
      } catch (e) {
        if (!cancelled) showError(e.message || 'Load failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when kind/id/new changes
  }, [kind, id, isNew]);

  if (!client || !meta) {
    return <EmptyState title="Unknown entity type" />;
  }

  const save = async () => {
    setSaving(true);
    try {
      const payload = JSON.parse(text);
      if (isNew) {
        const created = await client.create(payload);
        showSuccess('Created');
        navigate(`/settings/entity/${kind}/${created.id}`, { replace: true });
      } else {
        await client.update(id, payload);
        showSuccess('Saved');
      }
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

  const remove = async () => {
    if (isNew || !window.confirm('Delete this item from the server?')) return;
    setSaving(true);
    try {
      await client.remove(id);
      showSuccess('Deleted');
      navigate(meta.base, { replace: true });
    } catch (e) {
      showError(e.message || 'Delete failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={meta.base}>← Back</Link>
      </Button>
      <PageHeader
        title={`${meta.title} ${isNew ? '(new)' : `#${id}`}`}
        description="Raw JSON as Traccar REST — same idea as classic settings editors"
      />
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
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Create' : 'Save'}
            </Button>
            {!isNew && (
              <Button type="button" variant="destructive" onClick={remove} disabled={saving}>
                Delete
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
