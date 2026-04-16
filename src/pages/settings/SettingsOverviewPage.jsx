import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/context/SessionContext';
import { usePermissions } from '@/hooks/usePermissions';

const SECTIONS = [
  {
    title: 'Account',
    items: [
      { to: '/settings/preferences', title: 'Preferences', desc: 'User profile, map, locale, attributes' },
    ],
  },
  {
    title: 'Fleet',
    items: [
      { to: '/settings/notifications', title: 'Notifications', desc: 'Notificators and rules' },
      { to: '/settings/devices', title: 'Devices', desc: 'Device registry (admin API)' },
      { to: '/geofences', title: 'Geofences map', desc: 'Draw and edit zones' },
      { to: '/settings/geofences', title: 'Geofences list', desc: 'Table view' },
      { to: '/settings/groups', title: 'Groups', desc: 'Device groups' },
      { to: '/settings/drivers', title: 'Drivers', desc: 'Driver records' },
      { to: '/settings/calendars', title: 'Calendars', desc: 'Schedules' },
      { to: '/settings/attributes', title: 'Computed attributes', desc: 'Expression fields' },
      { to: '/settings/maintenances', title: 'Maintenance', desc: 'Intervals' },
      { to: '/settings/commands', title: 'Saved commands', desc: 'Command templates' },
      { to: '/settings/accumulators', title: 'Accumulators', desc: 'Per-device counters' },
      { to: '/settings/connections', title: 'Connections', desc: 'MQTT, HTTP, …' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/settings/announcement', title: 'Announcement', desc: 'Broadcast messages', manager: true },
      { to: '/settings/server', title: 'Server', desc: 'Global server options', admin: true },
      { to: '/settings/users', title: 'Users', desc: 'User accounts', manager: true },
      { to: '/settings/permissions', title: 'Permissions', desc: 'Matrix', admin: true },
    ],
  },
];

export default function SettingsOverviewPage() {
  const { user, server } = useSession();
  const { administrator, manager, readonly } = usePermissions();
  const userId = user?.id;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description={`Traccar server ${server?.version ? `· v${server.version}` : ''} — choose an area (same scope as the classic web app).`}
      />

      {userId && !readonly && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">My account</CardTitle>
            <CardDescription>Signed in as {user?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to={`/settings/user/${userId}`} className="text-sm font-medium text-primary underline">
              Edit my user record
            </Link>
          </CardContent>
        </Card>
      )}

      {SECTIONS.map((section) => {
        const items = section.items.filter((item) => {
          if (item.admin && !administrator) return false;
          if (item.manager && !manager) return false;
          return true;
        });
        if (!items.length) return null;
        return (
          <div key={section.title}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {section.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link key={item.to} to={item.to}>
                  <Card className="h-full transition-colors hover:border-primary/40 hover:shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="text-xs">{item.desc}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
