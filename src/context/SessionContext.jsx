import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [server, setServer] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const current = await api.session.get();
      setUser(current);
      setError(null);
    } catch (err) {
      if (err.status !== 401 && err.status !== 404) setError(err);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setServer(await api.session.server());
      } catch {
        /* server info is optional */
      }
      await refresh();
    })();
  }, [refresh]);

  const login = useCallback(async (email, password, code) => {
    const u = await api.session.login(email, password, code);
    setUser(u);
    setError(null);
    try {
      setServer(await api.session.server());
    } catch {
      /* optional */
    }
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.session.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  /** UI role for nav: admin | manager | driver */
  const role = user?.administrator ? 'admin' : user?.userLimit ? 'manager' : 'driver';

  const can = useCallback(
    (requiredRole) => {
      if (!user) return false;
      if (role === 'admin') return true;
      return role === requiredRole;
    },
    [role, user],
  );

  return (
    <SessionContext.Provider
      value={{
        user,
        server,
        ready,
        error,
        role,
        login,
        logout,
        refresh,
        can,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
};
