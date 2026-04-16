import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const LABELS = {
  '/settings/server': 'Server',
  '/settings/users': 'Users',
  '/settings/preferences': 'Preferences',
  '/settings/devices': 'Devices',
  '/settings/groups': 'Groups',
  '/settings/geofences': 'Geofences',
  '/settings/notifications': 'Notifications',
  '/settings/commands': 'Commands',
  '/settings/calendars': 'Calendars',
  '/settings/drivers': 'Drivers',
  '/settings/maintenance': 'Maintenance',
  '/settings/maintenances': 'Maintenance',
  '/settings/attributes': 'Computed attributes',
  '/settings/permissions': 'Permissions',
  '/settings/announcement': 'Announcement',
  '/settings/connections': 'Connections',
  '/settings/accumulators': 'Accumulators',
};

function segmentLabel(pathname) {
  if (LABELS[pathname]) return LABELS[pathname];
  const userMatch = pathname.match(/^\/settings\/user\/(\d+)$/);
  if (userMatch) return `User #${userMatch[1]}`;
  const accMatch = pathname.match(/^\/settings\/accumulators\/(\d+)$/);
  if (accMatch) return `Accumulators · device ${accMatch[1]}`;
  const entityMatch = pathname.match(/^\/settings\/entity\/([^/]+)\/([^/]+)$/);
  if (entityMatch) {
    const [, kind, id] = entityMatch;
    return `${kind} · ${id}`;
  }
  return 'Page';
}

export default function SettingsBreadcrumb() {
  const { pathname } = useLocation();
  if (pathname === '/settings' || pathname === '/settings/') return null;

  const current = segmentLabel(pathname);

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
      <Link to="/settings" className="font-medium text-primary hover:underline">
        Settings
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
      <span className="text-foreground">{current}</span>
    </nav>
  );
}
