import {
  LayoutDashboard,
  MapPin,
  Route,
  Truck,
  Users,
  Wrench,
  Fuel,
  BellRing,
  BarChart3,
  Settings,
  PlayCircle,
  Hexagon,
  Cpu,
  UserCircle,
  Package,
  Map,
} from 'lucide-react';

/**
 * Single flat main menu — every destination without a nested "More" submenu.
 * Mirrors Traccar primary areas (map, reports, devices, settings, …).
 */
/** Order optimized for web sidebar: core ops (devices, drivers, maintenance) before trips/geofences. */
export const mainNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'driver'] },
  { to: '/tracking', label: 'Live Tracking', icon: MapPin, roles: ['admin', 'manager', 'driver'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager', 'driver'], needsReports: true },
  { to: '/vehicles', label: 'Devices', icon: Truck, roles: ['admin', 'manager', 'driver'] },
  { to: '/drivers', label: 'Drivers', icon: Users, roles: ['admin', 'manager'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'manager'] },
  { to: '/trips', label: 'Trips', icon: Route, roles: ['admin', 'manager', 'driver'] },
  { to: '/geofences', label: 'Geofences', icon: Hexagon, roles: ['admin', 'manager', 'driver'] },
  { to: '/logistics', label: 'Logistics', icon: Package, roles: ['admin', 'manager'] },
  { to: '/route-planning', label: 'Route Planning', icon: Map, roles: ['admin', 'manager'] },
  { to: '/fuel', label: 'Fuel', icon: Fuel, roles: ['admin', 'manager'] },
  { to: '/alerts', label: 'Alerts', icon: BellRing, roles: ['admin', 'manager', 'driver'] },
  { to: '/replay', label: 'Replay', icon: PlayCircle, roles: ['admin', 'manager', 'driver'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'manager', 'driver'] },
  { to: '/emulator', label: 'Emulator', icon: Cpu, roles: ['admin', 'manager'] },
  { to: '/account', label: 'Account', icon: UserCircle, roles: ['admin', 'manager', 'driver'] },
];

/** Mobile bottom bar: quick access + “More” opens the full drawer (same items as sidebar). */
export const mobileQuickNavItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, roles: ['admin', 'manager', 'driver'] },
  { to: '/tracking', label: 'Live', icon: MapPin, roles: ['admin', 'manager', 'driver'] },
  { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager', 'driver'], needsReports: true },
  { to: '/vehicles', label: 'Devices', icon: Truck, roles: ['admin', 'manager', 'driver'] },
  { to: '/account', label: 'Account', icon: UserCircle, roles: ['admin', 'manager', 'driver'] },
];

export function filterNavItems(items, role, disableReports) {
  return items
    .filter((i) => i.roles.includes(role))
    .filter((i) => !(i.needsReports && disableReports));
}
