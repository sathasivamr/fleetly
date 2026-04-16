import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ReportToolbar from '@/components/reports/ReportToolbar';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { downloadCsv } from '@/lib/csv';
import EmptyState from '@/components/common/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const FETCHERS = {
  trips: (p) => api.reports.trips(p),
  route: (p) => api.reports.route(p),
  stops: (p) => api.reports.stops(p),
  summary: (p) => api.reports.summary(p),
  events: (p) => api.reports.events(p),
  geofences: (p) => api.reports.geofences(p),
  combined: (p) => api.reports.combined(p),
  chart: (p) => api.reports.chart(p),
  statistics: (p) => api.reports.statistics(p),
};

const TITLES = {
  trips: 'Trips',
  route: 'Route',
  stops: 'Stops',
  summary: 'Summary',
  events: 'Events',
  geofences: 'Geofences',
  combined: 'Combined',
  chart: 'Chart',
  statistics: 'Statistics',
};

function paramsFromSearch(searchParams) {
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (!from || !to) return null;
  const deviceIds = searchParams.getAll('deviceId').map(Number).filter((n) => Number.isFinite(n));
  const groupIds = searchParams.getAll('groupId').map(Number).filter((n) => Number.isFinite(n));
  const params = { from, to };
  if (deviceIds.length) params.deviceId = deviceIds;
  if (groupIds.length) params.groupId = groupIds;
  return params;
}

export default function ReportPage() {
  const { type } = useParams();
  const [searchParams] = useSearchParams();
  const { disableReports, administrator } = usePermissions();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetcher = FETCHERS[type];

  useEffect(() => {
    if (disableReports || !fetcher) return undefined;
    if (type === 'statistics' && !administrator) {
      setError('Administrators only');
      setRows(null);
      return undefined;
    }
    const params = paramsFromSearch(searchParams);
    if (!params) {
      setRows(null);
      setError(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await fetcher(params);
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : data ? [data] : []);
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed');
          setRows(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, fetcher, type, disableReports, administrator]);

  if (disableReports) {
    return (
      <EmptyState title="Reports disabled" description="Your account cannot access reports on this server." />
    );
  }

  if (!fetcher) {
    return <EmptyState title="Unknown report type" />;
  }

  if (type === 'statistics' && !administrator) {
    return <EmptyState title="Administrators only" />;
  }

  const title = TITLES[type] || type;
  const keys =
    rows?.length && typeof rows[0] === 'object'
      ? Object.keys(rows[0]).slice(0, 12)
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Traccar report API — filters sync to the URL (like the classic app)."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={!rows?.length}
              onClick={() => {
                if (!rows?.length) return;
                const columns = keys.map((k) => ({
                  key: k,
                  label: k,
                  format: (row) => {
                    const v = row[k];
                    if (v == null) return '';
                    if (typeof v === 'object') return JSON.stringify(v);
                    return v;
                  },
                }));
                downloadCsv(
                  `${type}-${new Date().toISOString().slice(0, 10)}.csv`,
                  columns,
                  rows,
                );
              }}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Link to="/reports" className="text-sm text-primary underline">
              All reports
            </Link>
          </>
        }
      />
      <ReportToolbar loading={loading} />
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : !rows ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Choose devices, optional groups, and time range, then run the report.
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No rows" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {keys.map((k) => (
                      <TableHead key={k} className="whitespace-nowrap">
                        {k}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      {keys.map((k) => (
                        <TableCell key={k} className="max-w-[240px] truncate text-xs">
                          {formatCell(row[k])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatCell(v) {
  if (v == null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}
