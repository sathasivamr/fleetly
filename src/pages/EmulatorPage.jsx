import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';

export default function EmulatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Device emulator"
        description="Protocol emulation is optional for demos — use the classic Traccar web UI or server tools. Fleetly focuses on operations and live data."
      />
      <EmptyState
        title="Not embedded in Fleetly"
        description="Open the classic Traccar interface or your gateway tools to simulate device traffic. Live positions then appear in Live Tracking and Dashboard."
      />
    </div>
  );
}
