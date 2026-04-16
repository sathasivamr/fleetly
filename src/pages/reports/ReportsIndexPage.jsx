import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePermissions } from '@/hooks/usePermissions';
import EmptyState from '@/components/common/EmptyState';

const ITEMS = [
  { to: 'trips', title: 'Trips', desc: 'Trip segments with distance and duration' },
  { to: 'route', title: 'Route', desc: 'Positions along a route' },
  { to: 'stops', title: 'Stops', desc: 'Stop events' },
  { to: 'summary', title: 'Summary', desc: 'Per-device summary for the period' },
  { to: 'events', title: 'Events', desc: 'Reported events' },
  { to: 'geofences', title: 'Geofences', desc: 'Geofence-related report' },
  { to: 'combined', title: 'Combined', desc: 'Combined report' },
  { to: 'chart', title: 'Chart', desc: 'Chart data' },
  { to: 'statistics', title: 'Statistics', desc: 'Statistics' },
  { to: 'scheduled', title: 'Scheduled', desc: 'Scheduled report jobs' },
  { to: 'audit', title: 'Audit', desc: 'Audit log (admin)' },
  { to: 'logs', title: 'Logs', desc: 'Server logs (admin)' },
];

export default function ReportsIndexPage() {
  const { disableReports } = usePermissions();

  if (disableReports) {
    return (
      <EmptyState title="Reports disabled" description="Your account cannot access reports on this server." />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="All Traccar report types — use the sidebar to switch reports; filters stay in the URL."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <Link key={item.to} to={`/reports/${item.to}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
