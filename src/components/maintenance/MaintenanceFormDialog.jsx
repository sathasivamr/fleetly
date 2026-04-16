import { useEffect, useMemo, useState } from 'react';
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
import {
  MAINTENANCE_TYPE_OPTIONS,
  decodeMaintenanceValues,
  encodeMaintenanceValues,
  maintenanceKind,
} from '@/lib/maintenanceFormat';
import { useFlash } from '@/context/FlashContext';

/**
 * @param {{ item?: object } | null} initial — raw API object when editing
 */
export default function MaintenanceFormDialog({ open, onOpenChange, initial, onSubmit }) {
  const { showError } = useFlash();
  const [name, setName] = useState('');
  const [type, setType] = useState('serviceOdometer');
  const [customType, setCustomType] = useState('');
  const [startStr, setStartStr] = useState('');
  const [periodStr, setPeriodStr] = useState('');
  const [attributesJson, setAttributesJson] = useState('{}');
  const [busy, setBusy] = useState(false);

  const effectiveType = type === '__custom__' ? customType.trim() : type;
  const kind = useMemo(() => maintenanceKind(effectiveType), [effectiveType]);

  const fieldHints = useMemo(() => {
    if (kind === 'calendar') {
      return {
        start: 'First service date',
        period: 'Repeat every (days)',
        unit: 'Dates use local midnight; period is whole days.',
      };
    }
    if (kind === 'distance') {
      return {
        start: 'Start at (km)',
        period: 'Service every (km)',
        unit: 'Values are converted to meters for the Traccar API.',
      };
    }
    if (kind === 'hours') {
      return {
        start: 'Start at (engine hours)',
        period: 'Repeat every (hours)',
        unit: 'Converted to milliseconds internally (× 3,600,000).',
      };
    }
    return {
      start: 'Start (raw)',
      period: 'Period (raw)',
      unit: 'Enter values exactly as your server expects for this type.',
    };
  }, [kind]);

  useEffect(() => {
    if (!open) return;
    const m = initial?.item;
    if (m) {
      const t = m.type || 'serviceOdometer';
      const preset = MAINTENANCE_TYPE_OPTIONS.some((o) => o.value === t);
      setType(preset ? t : '__custom__');
      setCustomType(preset ? '' : t);
      setName(m.name || '');
      const k = maintenanceKind(t);
      const decoded = decodeMaintenanceValues(k, m.start, m.period);
      setStartStr(decoded.startStr);
      setPeriodStr(decoded.periodStr);
      setAttributesJson(
        m.attributes && Object.keys(m.attributes).length ? JSON.stringify(m.attributes, null, 2) : '{}',
      );
    } else {
      setName('');
      setType('serviceOdometer');
      setCustomType('');
      setStartStr('0');
      setPeriodStr('5000');
      setAttributesJson('{}');
    }
  }, [open, initial]);

  const submit = async () => {
    const n = name.trim();
    const et = effectiveType;
    if (!n || !et) return;
    let attrs = {};
    try {
      attrs = JSON.parse(attributesJson || '{}');
      if (typeof attrs !== 'object' || attrs === null) throw new Error();
    } catch {
      showError('Attributes must be valid JSON object');
      return;
    }
    let start;
    let period;
    try {
      ({ start, period } = encodeMaintenanceValues(kind, { startStr, periodStr }));
    } catch (e) {
      showError(e.message || 'Invalid start/period');
      return;
    }
    setBusy(true);
    try {
      await onSubmit?.({
        name: n,
        type: et,
        start,
        period,
        attributes: attrs,
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const isEdit = Boolean(initial?.item);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit maintenance' : 'New maintenance rule'}</DialogTitle>
          <DialogDescription>
            Rules trigger when odometer, hours, or time crosses the start threshold, then repeat every
            period. Units below match classic Traccar behavior.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Name *</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oil change" />
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Type *</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {MAINTENANCE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
              <option value="__custom__">Custom attribute key…</option>
            </select>
          </label>
          {type === '__custom__' && (
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Custom key</span>
              <Input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="e.g. obdOdometer"
              />
            </label>
          )}

          <p className="text-xs text-muted-foreground">{fieldHints.unit}</p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">{fieldHints.start}</span>
              {kind === 'calendar' ? (
                <Input type="date" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
              ) : (
                <Input value={startStr} onChange={(e) => setStartStr(e.target.value)} />
              )}
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">{fieldHints.period}</span>
              <Input value={periodStr} onChange={(e) => setPeriodStr(e.target.value)} />
            </label>
          </div>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Extra attributes (JSON)</span>
            <Textarea
              value={attributesJson}
              onChange={(e) => setAttributesJson(e.target.value)}
              className="min-h-[72px] font-mono text-xs"
              spellCheck={false}
              placeholder="{}"
            />
            <span className="text-xs text-muted-foreground">
              Optional labels for UI (e.g. vehicle name, assignee) — same as Traccar attributes.
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !name.trim() || !effectiveType}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
