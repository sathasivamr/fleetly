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
import { buildSimpleCalendarData } from '@/lib/calendarIcs';
import { useFlash } from '@/context/FlashContext';

/**
 * @param {{ calendar?: object } | null} initial — raw calendar from API
 */
export default function CalendarFormDialog({ open, onOpenChange, initial, onSubmit }) {
  const { showError } = useFlash();
  const [name, setName] = useState('');
  const [mode, setMode] = useState('simple');
  const [frequency, setFrequency] = useState('DAILY');
  const [advancedData, setAdvancedData] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const c = initial?.calendar;
    if (c) {
      setName(c.name || '');
      setAdvancedData(c.data || '');
      setMode('advanced');
    } else {
      setName('');
      setFrequency('DAILY');
      setAdvancedData('');
      setMode('simple');
    }
  }, [open, initial]);

  const save = async () => {
    const n = name.trim();
    if (!n) {
      showError('Name is required');
      return;
    }
    let data;
    if (mode === 'simple') {
      data = buildSimpleCalendarData({ name: n, frequency });
    } else {
      const t = advancedData.trim();
      if (!t) {
        showError('Calendar data (base64) is required in advanced mode');
        return;
      }
      data = t;
    }
    setBusy(true);
    try {
      await onSubmit?.({ name: n, data });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const isEdit = Boolean(initial?.calendar);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit calendar' : 'Add calendar'}</DialogTitle>
          <DialogDescription>
            Calendars are base64-encoded iCalendar (VCALENDAR) data, same as classic Traccar. Simple mode
            creates a minimal recurring event; advanced mode lets you paste data exported from another tool.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Name *</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="space-y-1.5 text-sm">
            <span className="font-medium">Editor</span>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="simple">Simple schedule</option>
              <option value="advanced">Advanced (base64 iCal)</option>
            </select>
          </label>
          {mode === 'simple' && (
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Repeat</span>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly (Mondays)</option>
                <option value="MONTHLY">Monthly (1st)</option>
              </select>
              <span className="text-xs text-muted-foreground">
                Generates a new VEVENT with RRULE. Edit in advanced mode to fine-tune.
              </span>
            </label>
          )}
          {mode === 'advanced' && (
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Data (base64)</span>
              <Textarea
                value={advancedData}
                onChange={(e) => setAdvancedData(e.target.value)}
                className="min-h-[140px] font-mono text-xs"
                spellCheck={false}
              />
            </label>
          )}
        </div>
        <DialogFooter>
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
