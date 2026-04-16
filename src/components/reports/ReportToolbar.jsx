import { useEffect, useMemo, useState, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLiveData } from '@/context/LiveDataContext';
import { api } from '@/lib/api';

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

export default function ReportToolbar({ loading }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { devices } = useLiveData();
  const [groups, setGroups] = useState([]);

  const urlDeviceIds = useMemo(
    () => searchParams.getAll('deviceId').map(Number).filter((n) => Number.isFinite(n)),
    [searchParams],
  );
  const urlGroupIds = useMemo(
    () => searchParams.getAll('groupId').map(Number).filter((n) => Number.isFinite(n)),
    [searchParams],
  );

  const [from, setFrom] = useState(() => {
    const f = searchParams.get('from');
    return f ? toLocalInput(f) : defaultFrom();
  });
  const [to, setTo] = useState(() => {
    const t = searchParams.get('to');
    return t ? toLocalInput(t) : defaultTo();
  });

  const [selectedDevices, setSelectedDevices] = useState(() => new Set());
  const [selectedGroups, setSelectedGroups] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await api.groups.list();
        if (!cancelled) setGroups(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setGroups([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const f = searchParams.get('from');
    const t = searchParams.get('to');
    if (f) setFrom(toLocalInput(f));
    if (t) setTo(toLocalInput(t));
  }, [searchParams]);

  useEffect(() => {
    if (urlDeviceIds.length) {
      setSelectedDevices(new Set(urlDeviceIds));
    } else if (devices.length && selectedDevices.size === 0) {
      setSelectedDevices(new Set(devices.map((d) => d.id)));
    }
  }, [devices, urlDeviceIds]);

  useEffect(() => {
    if (urlGroupIds.length) setSelectedGroups(new Set(urlGroupIds));
  }, [urlGroupIds]);

  const toggleDevice = (id) => {
    setSelectedDevices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (id) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const run = useCallback(() => {
    const fromIso = new Date(from).toISOString();
    const toIso = new Date(to).toISOString();
    const deviceIds = Array.from(selectedDevices);
    const groupIds = Array.from(selectedGroups);

    const next = new URLSearchParams();
    deviceIds.forEach((id) => next.append('deviceId', String(id)));
    groupIds.forEach((id) => next.append('groupId', String(id)));
    next.set('from', fromIso);
    next.set('to', toIso);
    setSearchParams(next, { replace: true });
  }, [from, to, selectedDevices, selectedGroups, setSearchParams]);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">From</span>
          <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">To</span>
          <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <Button type="button" onClick={run} disabled={loading}>
          <Calendar className="mr-2 h-4 w-4" />
          Run report
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Devices</div>
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
            {devices.map((d) => (
              <label
                key={d.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedDevices.has(d.id)}
                  onChange={() => toggleDevice(d.id)}
                />
                {d.name ?? `#${d.id}`}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">Groups</div>
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
            {groups.map((g) => (
              <label
                key={g.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedGroups.has(g.id)}
                  onChange={() => toggleGroup(g.id)}
                />
                {g.name ?? `#${g.id}`}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function defaultFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 16);
}

function defaultTo() {
  return new Date().toISOString().slice(0, 16);
}
