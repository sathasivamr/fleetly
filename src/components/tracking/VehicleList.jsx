import { useMemo, useState } from 'react';
import { Search, Filter, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/common/StatusBadge';
import { cn, formatDate } from '@/lib/utils';

const FILTERS = ['all', 'moving', 'idle', 'stopped', 'alert'];

export default function VehicleList({ vehicles, selectedId, onSelect }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return vehicles.filter((v) => {
      const matchesStatus = status === 'all' || v.status === status;
      const name = String(v.name ?? '');
      const driver = String(v.driver ?? '');
      const plate = String(v.plate ?? '');
      const matchesQuery =
        !needle ||
        name.toLowerCase().includes(needle) ||
        driver.toLowerCase().includes(needle) ||
        plate.toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [vehicles, q, status]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 pb-2 pt-3">
        <div className="mb-2 px-0.5">
          <h2 className="text-sm font-semibold text-foreground">Live fleet</h2>
          <p className="text-[11px] text-muted-foreground">Select a vehicle to see map and address</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vehicles…"
            className="h-9 pl-9"
          />
        </div>
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatus(f)}
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors',
                status === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <ul className="flex-1 divide-y divide-border overflow-y-auto scrollbar-thin">
        {filtered.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => onSelect(v)}
              className={cn(
                'flex w-full flex-col gap-1.5 px-4 py-3 text-left transition-colors hover:bg-accent/60',
                selectedId === v.id && 'bg-primary/5 ring-1 ring-inset ring-primary/20',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{v.name ?? '—'}</span>
                  <StatusBadge status={v.status} />
                </div>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {v.speed} mph
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{v.driver}</div>
              {v.address ? (
                <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="line-clamp-1">{v.address}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{v.model}</span>
                <span>{formatDate(v.lastUpdate, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
