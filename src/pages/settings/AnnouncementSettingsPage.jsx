import { useEffect, useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';
import EmptyState from '@/components/common/EmptyState';
import { api } from '@/lib/api';
import { useFlash } from '@/context/FlashContext';

export default function AnnouncementSettingsPage() {
  const { manager } = usePermissions();
  const { showError, showSuccess } = useFlash();
  const [users, setUsers] = useState([]);
  const [notificators, setNotificators] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(() => new Set());
  const [notificator, setNotificator] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!manager) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const [uList, nList] = await Promise.all([
          api.users.list(),
          api.notifications.notificators({ announcement: true }),
        ]);
        if (cancelled) return;
        setUsers(Array.isArray(uList) ? uList : []);
        setNotificators(Array.isArray(nList) ? nList : []);
        if (Array.isArray(nList) && nList[0]?.type) {
          setNotificator(nList[0].type);
        }
      } catch (e) {
        if (!cancelled) showError(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manager]);

  const toggleUser = (id) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const send = async () => {
    if (!notificator || !subject.trim() || !body.trim()) {
      showError('Choose a channel, subject, and body');
      return;
    }
    const userIds = [...selectedUsers];
    if (userIds.length === 0) {
      showError('Select at least one user');
      return;
    }
    setSending(true);
    try {
      await api.notifications.send(notificator, userIds, { subject: subject.trim(), body: body.trim() });
      showSuccess('Announcement sent');
    } catch (e) {
      showError(e.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  if (!manager) {
    return (
      <EmptyState title="Access denied" description="Managers and administrators can send announcements." />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcement"
        description="POST /api/notifications/send/{notificator} — same flow as classic Traccar"
      />
      <Card>
        <CardHeader>
          <CardTitle>Composer</CardTitle>
          <CardDescription>
            Recipients must be selected. The server delivers via the chosen notificator (email, telegram,
            etc. depending on your Traccar configuration).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading users and channels…</p>
          ) : (
            <>
              <div>
                <div className="mb-2 text-sm font-medium">Recipients</div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                  {users.map((u) => (
                    <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(u.id)}
                        onChange={() => toggleUser(u.id)}
                      />
                      <span>
                        {u.name} ({u.email})
                      </span>
                    </label>
                  ))}
                  {users.length === 0 && (
                    <p className="text-sm text-muted-foreground">No users returned from the server.</p>
                  )}
                </div>
              </div>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Channel</span>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={notificator}
                  onChange={(e) => setNotificator(e.target.value)}
                >
                  <option value="">Select…</option>
                  {notificators.map((n) => (
                    <option key={n.type} value={n.type}>
                      {n.type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Subject</span>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Message</span>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} />
              </label>
              <Button type="button" onClick={send} disabled={sending}>
                {sending ? 'Sending…' : 'Send announcement'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
