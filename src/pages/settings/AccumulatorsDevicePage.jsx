import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useFlash } from '@/context/FlashContext';
import EmptyState from '@/components/common/EmptyState';

const METERS_PER_MI = 1609.344;

export default function AccumulatorsDevicePage() {
  const { deviceId } = useParams();
  const { showError, showSuccess } = useFlash();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [hoursDisplay, setHoursDisplay] = useState('');
  const [distanceDisplay, setDistanceDisplay] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [rawHoursMs, setRawHoursMs] = useState(0);
  const [rawMeters, setRawMeters] = useState(0);

  const metersToDisplay = (m) => (distanceUnit === 'km' ? m / 1000 : m / METERS_PER_MI);
  const displayToMeters = (v) =>
    distanceUnit === 'km' ? Number(v) * 1000 : Number(v) * METERS_PER_MI;

  useEffect(() => {
    if (!deviceId) return undefined;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const [dev, data] = await Promise.all([
          api.devices.get(deviceId).catch(() => null),
          api.devices.getAccumulators(deviceId),
        ]);
        if (cancelled) return;
        if (dev) setDeviceName(dev.name || '');
        const h = data?.hours ?? 0;
        const td = data?.totalDistance ?? 0;
        setRawHoursMs(h);
        setRawMeters(td);
        setHoursDisplay(h ? String(Math.round((h / 3600000) * 1000) / 1000) : '0');
        const km = td / 1000;
        setDistanceDisplay(td ? String(Math.round(km * 1000) / 1000) : '0');
      } catch (e) {
        if (!cancelled) {
          setLoadError(e.message || 'Failed to load accumulators');
          setHoursDisplay('0');
          setDistanceDisplay('0');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const save = async (e) => {
    e.preventDefault();
    const h = Number(hoursDisplay);
    const d = Number(distanceDisplay);
    if (!Number.isFinite(h) || !Number.isFinite(d)) {
      showError('Enter valid numbers');
      return;
    }
    setSaving(true);
    try {
      const hoursMs = Math.round(h * 3600000);
      const totalDistance = Math.round(displayToMeters(d));
      await api.devices.putAccumulators(deviceId, {
        deviceId: Number(deviceId),
        hours: hoursMs,
        totalDistance,
      });
      setRawHoursMs(hoursMs);
      setRawMeters(totalDistance);
      showSuccess('Accumulators saved — device reports will use these baselines.');
    } catch (err) {
      showError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const unitLabel = distanceUnit === 'km' ? 'km' : 'mi';

  const summary = useMemo(
    () => [
      { label: 'Hours (raw ms)', value: rawHoursMs },
      { label: 'Distance (raw m)', value: rawMeters },
    ],
    [rawHoursMs, rawMeters],
  );

  if (!deviceId) return <EmptyState title="Missing device" />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/settings/accumulators">← All devices</Link>
      </Button>

      <PageHeader
        title="Device accumulators"
        description={
          deviceName
            ? `${deviceName} · reset engine hours and odometer baseline stored on the server`
            : `Device #${deviceId} — engine hours and total distance`
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/vehicles/${deviceId}`}>Vehicle profile</Link>
          </Button>
        }
      />

      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Adjust values</CardTitle>
              <CardDescription>
                Matches classic Traccar: hours are total engine time; distance is the odometer baseline in
                meters on the server. Use this after replacing a cluster or correcting drift.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={save} className="max-w-md space-y-4">
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Engine hours</span>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={hoursDisplay}
                    onChange={(e) => setHoursDisplay(e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">Stored as milliseconds (× 3,600,000).</span>
                </label>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="block min-w-[200px] flex-1 space-y-1.5 text-sm">
                    <span className="font-medium">Total distance ({unitLabel})</span>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={distanceDisplay}
                      onChange={(e) => setDistanceDisplay(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Unit</span>
                    <select
                      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={distanceUnit}
                      onChange={(e) => {
                        const next = e.target.value;
                        const m = displayToMeters(distanceDisplay);
                        setDistanceUnit(next);
                        setDistanceDisplay(
                          m
                            ? String(
                                Math.round(
                                  (next === 'km' ? m / 1000 : m / METERS_PER_MI) * 1000,
                                ) / 1000,
                              )
                            : '0',
                        );
                      }}
                    >
                      <option value="km">Kilometers</option>
                      <option value="mi">Miles</option>
                    </select>
                  </label>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save accumulators'}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Server snapshot</CardTitle>
              <CardDescription>Raw values after load or save</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-mono">
              {summary.map((row) => (
                <div key={row.label} className="flex justify-between gap-2 border-b border-border py-1">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="tabular-nums">{row.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
