import { useEffect, useMemo, useState } from 'react';
import {
  Map,
  Plus,
  Pencil,
  Trash2,
  Eye,
  CalendarDays,
  Route,
  FileText,
  Search,
  Filter,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import RoutePlanFormDialog from '@/components/routeplanning/RoutePlanFormDialog';
import RouteMap from '@/components/routeplanning/RouteMap';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { routePlanService } from '@/lib/firebase';
import { useSession } from '@/context/SessionContext';
import { useFlash } from '@/context/FlashContext';
import { useLiveData } from '@/context/LiveDataContext';

const STATUS_CONFIG = {
  draft: { label: 'Draft', icon: FileText, tone: 'muted' },
  scheduled: { label: 'Scheduled', icon: CalendarDays, tone: 'primary' },
  active: { label: 'Active', icon: Route, tone: 'success' },
  completed: { label: 'Completed', icon: CheckCircle2, tone: 'info' },
  cancelled: { label: 'Cancelled', icon: XCircle, tone: 'destructive' },
};

export default function RoutePlanningPage() {
  const { user } = useSession();
  const { showError, showSuccess } = useFlash();
  const { vehicles } = useLiveData();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState(null);

  const vehicleMap = useMemo(() => {
    const m = {};
    vehicles.forEach((v) => { m[String(v.id)] = v.name; });
    return m;
  }, [vehicles]);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await routePlanService.list();
      setRoutes(list || []);
    } catch (e) {
      setLoadError(e.message || 'Failed to load route plans');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    reload();
  }, [user]);

  const filtered = useMemo(() => {
    let list = routes;
    if (filterStatus !== 'all') {
      list = list.filter((r) => r.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(q) ||
          (r.stops || []).some((s) => (s.address || '').toLowerCase().includes(q)),
      );
    }
    return list;
  }, [routes, filterStatus, search]);

  const stats = useMemo(() => ({
    total: routes.length,
    draft: routes.filter((r) => r.status === 'draft').length,
    active: routes.filter((r) => r.status === 'active' || r.status === 'scheduled').length,
    completed: routes.filter((r) => r.status === 'completed').length,
  }), [routes]);

  const handleSubmit = async (payload) => {
    try {
      if (editing) {
        await routePlanService.update(editing.id, payload);
        showSuccess('Route plan updated');
      } else {
        await routePlanService.create(payload);
        showSuccess('Route plan created');
      }
      setEditing(null);
      await reload();
    } catch (e) {
      showError(e.message || 'Save failed');
      throw e;
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await routePlanService.remove(deleteId);
      showSuccess('Route plan deleted');
      if (selectedRoute?.id === deleteId) setSelectedRoute(null);
      await reload();
      setDeleteId(null);
    } catch (e) {
      showError(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const mapStops = selectedRoute?.stops || [];

  return (
    <div className="space-y-5">
      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <PageHeader
        title="Route Planning"
        description="Plan, optimize, and manage multi-stop delivery routes"
        actions={
          <Button
            size="sm"
            type="button"
            onClick={() => { setEditing(null); setFormOpen(true); }}
          >
            <Plus className="h-4 w-4" /> New Route
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Total Routes</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Drafts</div>
              <div className="text-2xl font-semibold">{stats.draft}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Active</div>
              <div className="text-2xl font-semibold">{stats.active}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Completed</div>
              <div className="text-2xl font-semibold">{stats.completed}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map preview */}
      {selectedRoute && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">{selectedRoute.name}</CardTitle>
              <CardDescription>
                {(selectedRoute.stops || []).length} stops
                {selectedRoute.deviceId && ` · ${vehicleMap[selectedRoute.deviceId] || 'Vehicle'}`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRoute(null)}
            >
              Close map
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <RouteMap
              stops={mapStops}
              className="h-[350px] w-full rounded-b-lg"
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search routes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Route list */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((route) => {
              const cfg = STATUS_CONFIG[route.status] || STATUS_CONFIG.draft;
              const Icon = cfg.icon;
              const stopCount = (route.stops || []).length;
              const isSelected = selectedRoute?.id === route.id;

              return (
                <Card
                  key={route.id}
                  className={cn(
                    'transition-shadow hover:shadow-md cursor-pointer',
                    isSelected && 'ring-2 ring-primary',
                  )}
                  onClick={() => setSelectedRoute(isSelected ? null : route)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg',
                            cfg.tone === 'muted' && 'bg-muted text-muted-foreground',
                            cfg.tone === 'primary' && 'bg-primary/10 text-primary',
                            cfg.tone === 'success' && 'bg-success/10 text-success',
                            cfg.tone === 'info' && 'bg-blue-500/10 text-blue-500',
                            cfg.tone === 'destructive' && 'bg-destructive/10 text-destructive',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{route.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {cfg.label}
                            {route.scheduledDate && ` · ${route.scheduledDate}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View on map"
                          onClick={() => setSelectedRoute(isSelected ? null : route)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditing(route); setFormOpen(true); }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteId(route.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Stop summary */}
                    <div className="mt-3 space-y-1">
                      {(route.stops || []).slice(0, 4).map((stop, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                            {idx + 1}
                          </span>
                          <span className="truncate">{stop.address || 'No address'}</span>
                          {stop.estimatedArrival && (
                            <span className="ml-auto shrink-0 text-[10px]">{stop.estimatedArrival}</span>
                          )}
                        </div>
                      ))}
                      {stopCount > 4 && (
                        <div className="text-[10px] text-muted-foreground pl-6">
                          +{stopCount - 4} more stops
                        </div>
                      )}
                    </div>

                    {/* Vehicle */}
                    {route.deviceId && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {vehicleMap[route.deviceId] || 'Assigned vehicle'}
                      </div>
                    )}

                    {route.notes && (
                      <div className="mt-1 text-[10px] text-muted-foreground truncate">
                        {route.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {routes.length === 0 && !loadError && (
            <EmptyState
              title="No route plans"
              description="Create your first route plan to optimize deliveries."
            />
          )}

          {routes.length > 0 && filtered.length === 0 && (
            <EmptyState
              title="No matching routes"
              description="Try adjusting your search or filter."
            />
          )}
        </>
      )}

      <RoutePlanFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Delete route plan?"
        description="This will permanently remove this route plan."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
