import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useFlash } from '@/context/FlashContext';

/**
 * @param {{ command?: object } | null} initial — raw command from API when editing
 */
export default function CommandFormDialog({ open, onOpenChange, initial, onSubmit }) {
  const { showError } = useFlash();
  const [types, setTypes] = useState([]);
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [attributesJson, setAttributesJson] = useState('{}');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await api.commands.types();
        if (!cancelled && Array.isArray(list)) setTypes(list);
      } catch {
        if (!cancelled) setTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const c = initial?.command;
    if (c) {
      setDescription(c.description || '');
      setType(c.type || '');
      setAttributesJson(
        c.attributes && Object.keys(c.attributes).length
          ? JSON.stringify(c.attributes, null, 2)
          : '{}',
      );
    } else {
      setDescription('');
      setType('');
      setAttributesJson('{}');
    }
  }, [open, initial]);

  const save = async () => {
    if (!type.trim()) {
      showError('Select a command type');
      return;
    }
    let attributes = {};
    try {
      attributes = JSON.parse(attributesJson || '{}');
      if (typeof attributes !== 'object' || attributes === null) throw new Error();
    } catch {
      showError('Attributes must be a JSON object');
      return;
    }
    setBusy(true);
    try {
      await onSubmit?.({
        description: description.trim(),
        type: type.trim(),
        attributes,
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const isEdit = Boolean(initial?.command);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit saved command' : 'New saved command'}</DialogTitle>
          <DialogDescription>
            Pick a device command type and set its parameters (JSON). Types come from{' '}
            <code className="rounded bg-muted px-1 text-xs">GET /api/commands/types</code> — same as
            Traccar classic.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Description</span>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Label shown in lists"
            />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Type *</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Select type…</option>
              {types.map((t) => {
                const key = typeof t === 'string' ? t : t?.type;
                if (!key) return null;
                return (
                  <option key={key} value={key}>
                    {key}
                  </option>
                );
              })}
            </select>
            {types.length === 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-500">
                No types loaded — check permissions or server support.
              </span>
            )}
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Attributes (JSON)</span>
            <Textarea
              value={attributesJson}
              onChange={(e) => setAttributesJson(e.target.value)}
              className="min-h-[140px] font-mono text-xs"
              spellCheck={false}
            />
            <span className="text-xs text-muted-foreground">
              Keys depend on command type (e.g. frequency, data for SMS). Leave {'{}'} if none.
            </span>
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
