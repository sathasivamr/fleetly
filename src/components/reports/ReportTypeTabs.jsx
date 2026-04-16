import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { buildReportPath, REPORT_TABS } from '@/lib/reportNav';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Horizontal report switcher (replaces left sidebar). Preserves query params like classic Traccar.
 */
export default function ReportTypeTabs() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { administrator, readonly, disableReports } = usePermissions();
  const search = location.search || `?${searchParams.toString()}`;

  if (disableReports) return null;

  const tabs = REPORT_TABS.filter((t) => {
    if (t.admin && !administrator) return false;
    if (t.hideWhenReadonly && readonly) return false;
    return true;
  });

  return (
    <div className="-mx-1 mb-6 overflow-x-auto border-b border-border pb-px scrollbar-thin">
      <div className="flex min-w-min gap-0.5 px-1">
        {tabs.map((t) => {
          const to = buildReportPath(t.path, search);
          const isIndex = t.type === 'index';
          return (
            <NavLink
              key={t.path}
              to={to}
              end={isIndex}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-t-md border border-b-0 px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
                  isActive
                    ? 'border-border bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )
              }
            >
              {t.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
