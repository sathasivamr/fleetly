import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const FlashContext = createContext(null);

export function FlashProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showError = useCallback((message, duration = 6000) => {
    setToast({ type: 'error', message, id: Date.now() });
    if (duration > 0) {
      setTimeout(() => setToast((t) => (t?.message === message ? null : t)), duration);
    }
  }, []);

  const showSuccess = useCallback((message, duration = 4000) => {
    setToast({ type: 'success', message, id: Date.now() });
    if (duration > 0) {
      setTimeout(() => setToast(null), duration);
    }
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  useEffect(() => {
    const handler = (e) => {
      const err = e.detail;
      const msg = err?.message || 'Request failed';
      if (err?.status === 403) {
        setToast({ type: 'error', message: `Not allowed: ${msg}`, id: Date.now() });
      }
    };
    window.addEventListener('fleet-api-error', handler);
    return () => window.removeEventListener('fleet-api-error', handler);
  }, []);

  const value = useMemo(
    () => ({ toast, showError, showSuccess, dismiss }),
    [toast, showError, showSuccess, dismiss],
  );

  return <FlashContext.Provider value={value}>{children}</FlashContext.Provider>;
}

export function useFlash() {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error('useFlash must be used inside FlashProvider');
  return ctx;
}
