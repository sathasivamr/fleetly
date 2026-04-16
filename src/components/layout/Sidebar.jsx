import { NavLink } from 'react-router-dom';
import { ChevronLeft, Truck } from 'lucide-react';
import { mainNavItems, filterNavItems } from './navigation';
import { useSession } from '@/context/SessionContext';
import { useLiveData } from '@/context/LiveDataContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

export default function Sidebar({ collapsed, onToggle }) {
  const { role } = useSession();
  const { disableReports } = usePermissions();
  const { vehicles } = useLiveData();
  const items = filterNavItems(mainNavItems, role, disableReports);
  const online = vehicles.filter((v) => v.status !== 'offline').length;
  const util =
    vehicles.length > 0 ? Math.round((online / vehicles.length) * 100) : 0;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-card transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[248px]',
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Truck className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-none">Fleetly</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Fleet OS</div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      <nav
        className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3 scrollbar-thin"
        aria-label="Main"
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="m-3 rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-3">
          <div className="text-xs font-semibold text-foreground">Fleet health</div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {vehicles.length} vehicles · {online} online
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${util}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground">Online · {util}%</div>
        </div>
      )}
    </aside>
  );
}
