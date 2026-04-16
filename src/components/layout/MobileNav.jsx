import { NavLink } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { mobileQuickNavItems, filterNavItems } from './navigation';
import { useSession } from '@/context/SessionContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';

export default function MobileNav({ onOpenMore }) {
  const { role } = useSession();
  const { disableReports } = usePermissions();
  const items = filterNavItems(mobileQuickNavItems, role, disableReports);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-border bg-card/95 backdrop-blur lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors sm:text-[11px]',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className="truncate text-center">{item.label}</span>
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onOpenMore}
        className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-medium text-muted-foreground sm:text-[11px]"
      >
        <Menu className="h-5 w-5 shrink-0" />
        <span>More</span>
      </button>
    </nav>
  );
}
