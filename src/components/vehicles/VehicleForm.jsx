import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const emptyForm = () => ({
  name: '',
  uniqueId: '',
  model: '',
  plate: '',
  vin: '',
  groupId: '',
});

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {{ device?: object } | null} props.initial — `device` is raw Traccar device from API when editing
 * @param {(payload: { name: string, uniqueId: string, model: string, plate: string, vin: string, groupId: string }) => Promise<void>} props.onSubmit
 */
export default function VehicleForm({ open, onOpenChange, initial, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const d = initial?.device;
    if (d) {
      setForm({
        name: d.name || '',
        uniqueId: d.uniqueId || '',
        model: d.model || '',
        plate: d.attributes?.plate || '',
        vin: d.attributes?.vin || '',
        groupId: d.groupId != null ? String(d.groupId) : '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, initial]);

  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!onSubmit) return;
    setBusy(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const isEdit = Boolean(initial?.device);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit device' : 'Add device'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update device fields. Unique ID is the identifier Traccar uses for the tracker.'
              : 'Register a new device. Name and unique ID are required.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <Input value={form.name} onChange={handle('name')} placeholder="Vehicle name" />
          </Field>
          <Field label="Unique ID *">
            <Input
              value={form.uniqueId}
              onChange={handle('uniqueId')}
              placeholder="IMEI / identifier"
              disabled={isEdit}
              className={isEdit ? 'opacity-80' : ''}
            />
          </Field>
          <Field label="Model">
            <Input value={form.model} onChange={handle('model')} placeholder="Model" />
          </Field>
          <Field label="Group ID">
            <Input value={form.groupId} onChange={handle('groupId')} placeholder="Optional numeric group" />
          </Field>
          <Field label="License plate">
            <Input value={form.plate} onChange={handle('plate')} placeholder="Plate" />
          </Field>
          <Field label="VIN">
            <Input value={form.vin} onChange={handle('vin')} placeholder="VIN" />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !form.name?.trim() || !form.uniqueId?.trim()}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add device'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, className, children }) {
  return (
    <label className={`space-y-1.5 text-sm ${className || ''}`}>
      <div className="font-medium text-foreground">{label}</div>
      {children}
    </label>
  );
}
