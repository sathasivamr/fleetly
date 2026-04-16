import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Search, Bell, Moon, Sun, Plus, LogOut, User, Settings2, Menu, Users, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from '@/context/SessionContext';
import { useLiveData } from '@/context/LiveDataContext';
import { initials } from '@/lib/utils';

export default function Topbar({ onOpenMobile }) {
  const { theme, toggle } = useTheme();
  const { user, logout, role } = useSession();
  const { alerts } = useLiveData();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const openAlerts = alerts.filter((a) => a.status === 'open');

  const displayName = user?.name || user?.email || 'User';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vehicles, drivers, trips…"
          className="h-10 pl-9"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </div>

      {(role === 'admin' || role === 'manager') && (
        <nav
          className="hidden shrink-0 items-center gap-0.5 lg:flex"
          aria-label="Quick fleet links"
        >
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2 text-muted-foreground" asChild>
            <Link to="/drivers">
              <Users className="h-4 w-4" />
              Drivers
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2 text-muted-foreground" asChild>
            <Link to="/maintenance">
              <Wrench className="h-4 w-4" />
              Maintenance
            </Link>
          </Button>
        </nav>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button size="sm" className="hidden md:inline-flex" disabled>
          <Plus className="h-4 w-4" /> New trip
        </Button>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              {openAlerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Alerts</span>
              <Badge variant="destructive">{openAlerts.length} open</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {openAlerts.slice(0, 4).map((a) => (
              <DropdownMenuItem key={a.id} className="flex-col items-start gap-0.5 py-2">
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {a.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{a.vehicle}</span>
                </div>
                <span className="text-sm">{a.message}</span>
              </DropdownMenuItem>
            ))}
            {openAlerts.length === 0 && (
              <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                No open alerts
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left lg:block">
                <div className="text-sm font-medium leading-none">{displayName}</div>
                <div className="mt-1 text-[11px] capitalize text-muted-foreground">
                  {role}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate('/account')}>
              <User className="h-4 w-4" /> Account
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate('/settings/preferences')}>
              <Settings2 className="h-4 w-4" /> Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
