import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLiveData } from '@/context/LiveDataContext';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['pending', 'assigned', 'in-transit', 'delivered', 'cancelled'];

const blank = {
  orderNumber: '',
  customerName: '',
  pickupAddress: '',
  deliveryAddress: '',
  deviceId: '',
  driverId: '',
  priority: 'medium',
  status: 'pending',
  scheduledDate: '',
  notes: '',
  weight: '',
  itemDescription: '',
};

export default function OrderFormDialog({ open, onOpenChange, initial, onSubmit }) {
  const { vehicles } = useLiveData();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...blank, ...initial } : blank);
    }
  }, [open, initial]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        weight: form.weight ? Number(form.weight) : null,
      });
      onOpenChange(false);
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Order' : 'New Logistics Order'}</DialogTitle>
          <DialogDescription>
            {initial ? 'Update order details' : 'Create a new delivery order'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="orderNumber">Order #</Label>
              <Input
                id="orderNumber"
                value={form.orderNumber}
                onChange={(e) => set('orderNumber', e.target.value)}
                placeholder="ORD-001"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerName">Customer</Label>
              <Input
                id="customerName"
                value={form.customerName}
                onChange={(e) => set('customerName', e.target.value)}
                placeholder="Customer name"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="itemDescription">Item description</Label>
            <Input
              id="itemDescription"
              value={form.itemDescription}
              onChange={(e) => set('itemDescription', e.target.value)}
              placeholder="Package contents"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pickupAddress">Pickup address</Label>
              <Input
                id="pickupAddress"
                value={form.pickupAddress}
                onChange={(e) => set('pickupAddress', e.target.value)}
                placeholder="Pickup location"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deliveryAddress">Delivery address</Label>
              <Input
                id="deliveryAddress"
                value={form.deliveryAddress}
                onChange={(e) => set('deliveryAddress', e.target.value)}
                placeholder="Delivery location"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Assign vehicle</Label>
              <Select value={form.deviceId} onValueChange={(v) => set('deviceId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={form.weight}
                onChange={(e) => set('weight', e.target.value)}
                placeholder="0.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduledDate">Scheduled</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={form.scheduledDate}
                onChange={(e) => set('scheduledDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Special instructions..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : initial ? 'Update' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
