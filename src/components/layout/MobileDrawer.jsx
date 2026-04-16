import { NavLink } from 'react-router-dom';
import { Truck, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { mainNavItems, filterNavItems } from './navigation';
import { useSession } from '@/context/SessionContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

export default function MobileDrawer({ open, onOpenChange }) {
  const { role } = useSession();
  const { disableReports } = usePermissions();
  const items = filterNavItems(mainNavItems, role, disableReports);

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 left-0 h-full w-[85%] max-w-xs translate-x-0 translate-y-0 rounded-none border-r p-0 sm:max-w-xs">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none">Fleetly</div>
              <div className="mt-1 text-[11px] text-muted-foreground">Fleet OS</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Main">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onOpenChange(false)}
              className={linkClass}
              end={item.to === '/dashboard'}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
