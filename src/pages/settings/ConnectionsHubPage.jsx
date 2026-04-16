import { Link } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LINKS = [
  { to: '/settings/devices', label: 'Devices' },
  { to: '/settings/groups', label: 'Groups' },
  { to: '/settings/users', label: 'Users' },
];

export default function ConnectionsHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Connections" description="Per device, group, or user in Traccar." />
      <Card>
        <CardHeader>
          <CardTitle>Edit in classic UI</CardTitle>
          <CardDescription>
            Connection forms are embedded on each entity in the classic app. Use these lists, then open the classic UI
            for full MQTT/HTTP connection editors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="block text-sm font-medium text-primary underline">
              {l.label}
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
