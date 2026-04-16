import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppShell from './components/layout/AppShell.jsx';
import LoadingScreen from './components/common/LoadingScreen.jsx';
import { useSession } from './context/SessionContext.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import SessionExpiredListener from './components/common/SessionExpiredListener.jsx';
import FlashToast from './components/common/FlashToast.jsx';
import NavigationBootstrap from './components/common/NavigationBootstrap.jsx';

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'));
const LiveTrackingPage = lazy(() => import('./pages/LiveTrackingPage.jsx'));
const TripsPage = lazy(() => import('./pages/TripsPage.jsx'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage.jsx'));
const VehicleProfilePage = lazy(() => import('./pages/VehicleProfilePage.jsx'));
const DriversPage = lazy(() => import('./pages/DriversPage.jsx'));
const DriverProfilePage = lazy(() => import('./pages/DriverProfilePage.jsx'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage.jsx'));
const FuelPage = lazy(() => import('./pages/FuelPage.jsx'));
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const ChangeServerPage = lazy(() => import('./pages/ChangeServerPage.jsx'));

const LogisticsPage = lazy(() => import('./pages/LogisticsPage.jsx'));
const RoutePlanningPage = lazy(() => import('./pages/RoutePlanningPage.jsx'));

const ReportsShell = lazy(() => import('./pages/reports/ReportsShell.jsx'));
const ReportsIndexPage = lazy(() => import('./pages/reports/ReportsIndexPage.jsx'));
const ReportPage = lazy(() => import('./pages/reports/ReportPage.jsx'));
const ScheduledReportsPage = lazy(() => import('./pages/reports/ScheduledReportsPage.jsx'));
const AuditPage = lazy(() => import('./pages/reports/AuditPage.jsx'));
const LogsPage = lazy(() => import('./pages/reports/LogsPage.jsx'));

const SettingsLayout = lazy(() => import('./pages/settings/SettingsLayout.jsx'));
const SettingsOverviewPage = lazy(() => import('./pages/settings/SettingsOverviewPage.jsx'));
const ServerSettingsPage = lazy(() => import('./pages/settings/ServerSettingsPage.jsx'));
const UsersSettingsPage = lazy(() => import('./pages/settings/UsersSettingsPage.jsx'));
const UserSettingsDetailPage = lazy(() => import('./pages/settings/UserSettingsDetailPage.jsx'));
const DevicesSettingsPage = lazy(() => import('./pages/settings/DevicesSettingsPage.jsx'));
const GroupsSettingsPage = lazy(() => import('./pages/settings/GroupsSettingsPage.jsx'));
const GeofencesSettingsPage = lazy(() => import('./pages/settings/GeofencesSettingsPage.jsx'));
const NotificationsSettingsPage = lazy(() => import('./pages/settings/NotificationsSettingsPage.jsx'));
const CommandsSettingsPage = lazy(() => import('./pages/settings/CommandsSettingsPage.jsx'));
const CalendarsSettingsPage = lazy(() => import('./pages/settings/CalendarsSettingsPage.jsx'));
const PreferencesSettingsPage = lazy(() => import('./pages/settings/PreferencesSettingsPage.jsx'));
const DriversSettingsPage = lazy(() => import('./pages/settings/DriversSettingsPage.jsx'));
const MaintenanceSettingsPage = lazy(() => import('./pages/settings/MaintenanceSettingsPage.jsx'));
const ComputedAttributesSettingsPage = lazy(() =>
  import('./pages/settings/ComputedAttributesSettingsPage.jsx'),
);
const PermissionsSettingsPage = lazy(() => import('./pages/settings/PermissionsSettingsPage.jsx'));
const AnnouncementSettingsPage = lazy(() => import('./pages/settings/AnnouncementSettingsPage.jsx'));
const ConnectionsHubPage = lazy(() => import('./pages/settings/ConnectionsHubPage.jsx'));
const AccumulatorsIndexPage = lazy(() => import('./pages/settings/AccumulatorsIndexPage.jsx'));
const AccumulatorsDevicePage = lazy(() => import('./pages/settings/AccumulatorsDevicePage.jsx'));
const SettingsJsonEntityPage = lazy(() => import('./pages/settings/SettingsJsonEntityPage.jsx'));

const ReplayPage = lazy(() => import('./pages/ReplayPage.jsx'));
const PositionDetailPage = lazy(() => import('./pages/PositionDetailPage.jsx'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage.jsx'));
const NetworkPage = lazy(() => import('./pages/NetworkPage.jsx'));
const GeofencesMapPage = lazy(() => import('./pages/GeofencesMapPage.jsx'));
const EmulatorPage = lazy(() => import('./pages/EmulatorPage.jsx'));

function RequireAuth({ children }) {
  const { user } = useSession();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user, ready } = useSession();

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />
        <Route
          path="/reset-password"
          element={user ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
        />
        <Route
          path="/change-server"
          element={user ? <Navigate to="/dashboard" replace /> : <ChangeServerPage />}
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/tracking" element={<LiveTrackingPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:id" element={<VehicleProfilePage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/drivers/:id" element={<DriverProfilePage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/logistics" element={<LogisticsPage />} />
          <Route path="/route-planning" element={<RoutePlanningPage />} />
          <Route path="/fuel" element={<FuelPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/position/:id" element={<PositionDetailPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/network/:positionId" element={<NetworkPage />} />
          <Route path="/geofences" element={<GeofencesMapPage />} />
          <Route path="/emulator" element={<EmulatorPage />} />

          <Route element={<ReportsShell />}>
            <Route path="reports">
              <Route index element={<ReportsIndexPage />} />
              <Route path="scheduled" element={<ScheduledReportsPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="logs" element={<LogsPage />} />
              <Route path=":type" element={<ReportPage />} />
            </Route>
            <Route path="replay" element={<ReplayPage />} />
          </Route>

          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<SettingsOverviewPage />} />
            <Route path="server" element={<ServerSettingsPage />} />
            <Route path="users" element={<UsersSettingsPage />} />
            <Route path="user/:id" element={<UserSettingsDetailPage />} />
            <Route path="devices" element={<DevicesSettingsPage />} />
            <Route path="groups" element={<GroupsSettingsPage />} />
            <Route path="geofences" element={<GeofencesSettingsPage />} />
            <Route path="notifications" element={<NotificationsSettingsPage />} />
            <Route path="commands" element={<CommandsSettingsPage />} />
            <Route path="calendars" element={<CalendarsSettingsPage />} />
            <Route path="preferences" element={<PreferencesSettingsPage />} />
            <Route path="drivers" element={<DriversSettingsPage />} />
            <Route path="maintenance" element={<MaintenanceSettingsPage />} />
            <Route path="maintenances" element={<MaintenanceSettingsPage />} />
            <Route path="attributes" element={<ComputedAttributesSettingsPage />} />
            <Route path="permissions" element={<PermissionsSettingsPage />} />
            <Route path="announcement" element={<AnnouncementSettingsPage />} />
            <Route path="connections" element={<ConnectionsHubPage />} />
            <Route path="accumulators/:deviceId" element={<AccumulatorsDevicePage />} />
            <Route path="accumulators" element={<AccumulatorsIndexPage />} />
            <Route path="entity/:kind/:id" element={<SettingsJsonEntityPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <>
      <NavigationBootstrap />
      <SessionExpiredListener />
      <FlashToast />
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </>
  );
}
