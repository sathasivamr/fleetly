import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Search,
  Filter,
  MapPin,
  Radio,
  Bell,
  PlayCircle,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import OrderFormDialog from '@/components/logistics/OrderFormDialog';
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
import { logisticsService, getLogisticsBackendMode } from '@/lib/logisticsService';
import { useSession } from '@/context/SessionContext';
import { useFlash } from '@/context/FlashContext';
import { useLiveData } from '@/context/LiveDataContext';

const STATUS_COLUMNS = [
  { id: 'pending', title: 'Pending', icon: Clock, tone: 'warning' },
  { id: 'assigned', title: 'Assigned', icon: Truck, tone: 'primary' },
  { id: 'in-transit', title: 'In Transit', icon: ArrowRight, tone: 'info' },
  { id: 'delivered', title: 'Delivered', icon: CheckCircle2, tone: 'success' },
  { id: 'cancelled', title: 'Cancelled', icon: XCircle, tone: 'destructive' },
];

const PRIORITY_COLORS = {
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  medium: 'bg-primary/10 text-primary border-primary/30',
  low: 'bg-muted text-muted-foreground border-border',
};

export default function LogisticsPage() {
  const { user } = useSession();
  const { showError, showSuccess } = useFlash();
  const { vehicles, alerts } = useLiveData();
  const backendMode = getLogisticsBackendMode();

  const fleetSnapshot = useMemo(() => {
    const total = vehicles.length;
    const online = vehicles.filter((v) => v.status !== 'offline').length;
    const offline = total - online;
    return { total, online, offline, alertCount: alerts.length };
  }, [vehicles, alerts]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const vehicleMap = useMemo(() => {
    const m = {};
    vehicles.forEach((v) => { m[String(v.id)] = v.name; });
    return m;
  }, [vehicles]);

  const reload = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await logisticsService.list();
      setOrders(list || []);
    } catch (e) {
      setLoadError(e.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    reload();
  }, [user]);

  const filtered = useMemo(() => {
    let list = orders;
    if (filterStatus !== 'all') {
      list = list.filter((o) => o.status === filterStatus);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q) ||
          (o.deliveryAddress || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [orders, filterStatus, search]);

  const grouped = useMemo(() => {
    const out = {};
    STATUS_COLUMNS.forEach((c) => { out[c.id] = []; });
    filtered.forEach((o) => {
      if (out[o.status]) out[o.status].push(o);
      else out.pending.push(o);
    });
    return out;
  }, [filtered]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    inTransit: orders.filter((o) => o.status === 'in-transit').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  }), [orders]);

  const handleSubmit = async (payload) => {
    try {
      if (editing) {
        await logisticsService.update(editing.id, payload);
        showSuccess('Order updated');
      } else {
        await logisticsService.create(payload);
        showSuccess('Order created');
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
      await logisticsService.remove(deleteId);
      showSuccess('Order deleted');
      await reload();
      setDeleteId(null);
    } catch (e) {
      showError(e.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <PageHeader
        title="Logistics"
        description="Manage delivery orders, track shipments, and assign vehicles"
        actions={
          <Button
            size="sm"
            type="button"
            onClick={() => { setEditing(null); setFormOpen(true); }}
          >
            <Plus className="h-4 w-4" /> New Order
          </Button>
        }
      />

      {backendMode === 'demo' && (
        <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Demo data</span>
          {' — '}
          Orders are stored in this browser only (localStorage). Configure Firebase or
          {' '}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_LOGISTICS_API_URL</code>
          {' '}
          for a shared backend; see <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code>.
        </div>
      )}
      {backendMode === 'firestore' && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Firebase</span>
          {' — '}
          Logistics orders are stored in Firestore (see <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_FIREBASE_*</code>).
        </div>
      )}
      {backendMode === 'commercial_api' && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">External API</span>
          {' — '}
          Orders are loaded from the REST API configured by <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_LOGISTICS_API_URL</code>.
        </div>
      )}

      {/* Fleet snapshot (Traccar-composed) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fleet snapshot</CardTitle>
          <CardDescription>
            From your Traccar connection (live devices and recent socket events).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">Devices</div>
              <div className="text-xl font-semibold">{fleetSnapshot.total}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">Online</div>
              <div className="text-xl font-semibold text-success">{fleetSnapshot.online}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">Offline</div>
              <div className="text-xl font-semibold text-muted-foreground">{fleetSnapshot.offline}</div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1 text-xs font-medium uppercase text-muted-foreground">
                <Bell className="h-3 w-3" /> Recent events
              </div>
              <div className="text-xl font-semibold">{fleetSnapshot.alertCount}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/trips">
                <Truck className="h-4 w-4" /> Trips
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/reports/replay">
                <PlayCircle className="h-4 w-4" /> Replay
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/geofences">
                <MapPin className="h-4 w-4" /> Geofences
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/tracking">
                <Radio className="h-4 w-4" /> Live tracking
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Total</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Pending</div>
              <div className="text-2xl font-semibold">{stats.pending}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">In Transit</div>
              <div className="text-2xl font-semibold">{stats.inTransit}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-muted-foreground">Delivered</div>
              <div className="text-2xl font-semibold">{stats.delivered}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search orders..."
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
              {STATUS_COLUMNS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {STATUS_COLUMNS.map((col) => {
              const Icon = col.icon;
              return (
                <Card key={col.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          col.tone === 'warning' && 'bg-warning',
                          col.tone === 'primary' && 'bg-primary',
                          col.tone === 'info' && 'bg-blue-500',
                          col.tone === 'success' && 'bg-success',
                          col.tone === 'destructive' && 'bg-destructive',
                        )}
                      />
                      <CardTitle className="text-sm">{col.title}</CardTitle>
                    </div>
                    <CardDescription>{grouped[col.id].length}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {grouped[col.id].length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        No orders
                      </div>
                    )}
                    {grouped[col.id].map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {order.orderNumber}
                          </span>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                                PRIORITY_COLORS[order.priority] || PRIORITY_COLORS.medium,
                              )}
                            >
                              {order.priority}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => { setEditing(order); setFormOpen(true); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => setDeleteId(order.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-1 text-sm font-medium">{order.customerName}</div>
                        {order.itemDescription && (
                          <div className="mt-0.5 text-xs text-muted-foreground truncate">
                            {order.itemDescription}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <ArrowRight className="h-3 w-3" />
                          <span className="truncate">{order.deliveryAddress}</span>
                        </div>
                        {order.deviceId && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            Vehicle: {vehicleMap[order.deviceId] || order.deviceId}
                          </div>
                        )}
                        {order.scheduledDate && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            Scheduled: {order.scheduledDate}
                          </div>
                        )}
                        {order.weight && (
                          <div className="mt-0.5 text-[10px] text-muted-foreground">
                            {order.weight} kg
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {orders.length === 0 && !loadError && (
            <EmptyState
              title="No logistics orders"
              description="Create your first delivery order to get started."
            />
          )}
        </>
      )}

      <OrderFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={deleteId != null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        title="Delete order?"
        description="This will permanently remove this logistics order."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        busy={deleting}
      />
    </div>
  );
}
