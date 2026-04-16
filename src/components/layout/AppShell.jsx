import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import MobileNav from './MobileNav.jsx';
import MobileDrawer from './MobileDrawer.jsx';
import TermsGate from './TermsGate.jsx';
import { useLiveData } from '@/context/LiveDataContext';

function SocketBanner() {
  const { connected, socketError } = useLiveData();
  if (connected || !socketError) return null;
  return (
    <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm text-warning-foreground">
      <WifiOff className="h-4 w-4 shrink-0" />
      {socketError}
    </div>
  );
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TermsGate>
      <div className="flex h-full min-h-screen w-full bg-background">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <SocketBanner />
          <Topbar onOpenMobile={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileNav onOpenMore={() => setMobileOpen(true)} />
        <MobileDrawer open={mobileOpen} onOpenChange={setMobileOpen} />
      </div>
    </TermsGate>
  );
}
