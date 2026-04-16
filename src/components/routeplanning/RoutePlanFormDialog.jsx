import { useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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

const STATUSES = ['draft', 'scheduled', 'active', 'completed', 'cancelled'];

const blankStop = () => ({
  id: crypto.randomUUID(),
  address: '',
  lat: '',
  lng: '',
  notes: '',
  estimatedArrival: '',
});

const blank = {
  name: '',
  deviceId: '',
  status: 'draft',
  scheduledDate: '',
  notes: '',
  stops: [blankStop(), blankStop()],
};

export default function RoutePlanFormDialog({ open, onOpenChange, initial, onSubmit }) {
  const { vehicles } = useLiveData();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          ...blank,
          ...initial,
          stops:
            initial.stops && initial.stops.length >= 2
              ? initial.stops.map((s) => ({ ...blankStop(), ...s }))
              : [blankStop(), blankStop()],
        });
      } else {
        setForm({ ...blank, stops: [blankStop(), blankStop()] });
      }
    }
  }, [open, initial]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const updateStop = (idx, key, val) => {
    setForm((prev) => ({
      ...prev,
      stops: prev.stops.map((s, i) => (i === idx ? { ...s, [key]: val } : s)),
    }));
  };

  const addStop = () => {
    setForm((prev) => ({ ...prev, stops: [...prev.stops, blankStop()] }));
  };

  const removeStop = (idx) => {
    if (form.stops.length <= 2) return;
    setForm((prev) => ({ ...prev, stops: prev.stops.filter((_, i) => i !== idx) }));
  };

  const moveStop = (from, to) => {
    if (to < 0 || to >= form.stops.length) return;
    setForm((prev) => {
      const stops = [...prev.stops];
      const [moved] = stops.splice(from, 1);
      stops.splice(to, 0, moved);
      return { ...prev, stops };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const stops = form.stops.map((s) => ({
        address: s.address,
        lat: s.lat ? Number(s.lat) : null,
        lng: s.lng ? Number(s.lng) : null,
        notes: s.notes,
        estimatedArrival: s.estimatedArrival,
      }));
      await onSubmit({ ...form, stops });
      onOpenChange(false);
    } catch {
      // handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Route Plan' : 'New Route Plan'}</DialogTitle>
          <DialogDescription>
            {initial ? 'Update route details and stops' : 'Plan a multi-stop delivery route'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="routeName">Route name</Label>
              <Input
                id="routeName"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Morning delivery run"
                required
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scheduledDate">Scheduled date</Label>
              <Input
                id="scheduledDate"
                type="date"
                value={form.scheduledDate}
                onChange={(e) => set('scheduledDate', e.target.value)}
              />
            </div>
          </div>

          {/* Stops */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Stops ({form.stops.length})
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addStop}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add stop
              </Button>
            </div>

            <div className="space-y-2">
              {form.stops.map((stop, idx) => (
                <div
                  key={stop.id}
                  className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3"
                >
                  <div className="flex flex-col items-center gap-1 pt-2">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={idx === 0}
                      onClick={() => moveStop(idx, idx - 1)}
                    >
                      <GripVertical className="h-4 w-4 rotate-180" />
                    </button>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={idx === form.stops.length - 1}
                      onClick={() => moveStop(idx, idx + 1)}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={idx === 0 ? 'Start address' : idx === form.stops.length - 1 ? 'Final destination' : `Stop ${idx + 1} address`}
                      value={stop.address}
                      onChange={(e) => updateStop(idx, 'address', e.target.value)}
                      required
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Latitude"
                        value={stop.lat}
                        onChange={(e) => updateStop(idx, 'lat', e.target.value)}
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Longitude"
                        value={stop.lng}
                        onChange={(e) => updateStop(idx, 'lng', e.target.value)}
                      />
                      <Input
                        type="time"
                        placeholder="ETA"
                        value={stop.estimatedArrival}
                        onChange={(e) => updateStop(idx, 'estimatedArrival', e.target.value)}
                      />
                    </div>
                    <Input
                      placeholder="Stop notes (optional)"
                      value={stop.notes}
                      onChange={(e) => updateStop(idx, 'notes', e.target.value)}
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={form.stops.length <= 2}
                    onClick={() => removeStop(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="routeNotes">Route notes</Label>
            <Input
              id="routeNotes"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any special instructions for this route..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : initial ? 'Update Route' : 'Create Route'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
