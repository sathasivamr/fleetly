import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';

/** Redirects to login when API returns 401 (session expired). */
export default function SessionExpiredListener() {
  const navigate = useNavigate();
  const { logout } = useSession();

  useEffect(() => {
    const handler = async () => {
      await logout();
      navigate('/login', { replace: true });
    };
    window.addEventListener('fleet-session-expired', handler);
    return () => window.removeEventListener('fleet-session-expired', handler);
  }, [logout, navigate]);

  return null;
}
