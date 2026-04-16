import { Outlet } from 'react-router-dom';
import SettingsBreadcrumb from './SettingsBreadcrumb';

/**
 * No sidebar — all settings areas are linked from the main app menu and /settings hub.
 */
export default function SettingsLayout() {
  return (
    <div className="min-w-0">
      <SettingsBreadcrumb />
      <Outlet />
    </div>
  );
}
