import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDistance, formatDuration, formatDate } from '@/lib/utils';

export default function RecentTripsTable({ trips = [], loading }) {
  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Loading trips…</div>
    );
  }
  if (!trips.length) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        No trips in the selected window — try widening the date range on the Trips page.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Trip</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Driver</TableHead>
          <TableHead>Route</TableHead>
          <TableHead className="text-right">Distance</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trips.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="font-mono text-xs">{t.id}</TableCell>
            <TableCell>
              <Link
                to={`/vehicles/${t.deviceId}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {t.vehicle}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{t.driver}</TableCell>
            <TableCell className="max-w-[280px]">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="truncate">{t.from}</span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="truncate">{t.to}</span>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatDistance(t.distance)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatDuration(t.duration)}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {formatDate(t.startTime)}
            </TableCell>
            <TableCell>
              <StatusBadge status={t.endTime ? 'completed' : 'on-trip'} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
