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
  phone: '',
  email: '',
  license: '',
});

/**
 * @param {object} props
 * @param {{ driver?: object } | null} props.initial — raw Traccar driver when editing
 */
export default function DriverForm({ open, onOpenChange, initial, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const d = initial?.driver;
    const attr = d?.attributes || {};
    if (d) {
      setForm({
        name: d.name || '',
        uniqueId: d.uniqueId || '',
        phone: attr.phone || '',
        email: attr.email || '',
        license: attr.license || '',
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

  const isEdit = Boolean(initial?.driver);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit driver' : 'Add driver'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update driver. Unique ID identifies the driver in Traccar.'
              : 'Name and unique ID are required.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name *">
            <Input value={form.name} onChange={handle('name')} />
          </Field>
          <Field label="Unique ID *">
            <Input value={form.uniqueId} onChange={handle('uniqueId')} disabled={isEdit} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={handle('phone')} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={handle('email')} />
          </Field>
          <Field label="License" className="sm:col-span-2">
            <Input value={form.license} onChange={handle('license')} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !form.name?.trim() || !form.uniqueId?.trim()}>
            {busy ? 'Saving…' : isEdit ? 'Save' : 'Add driver'}
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
