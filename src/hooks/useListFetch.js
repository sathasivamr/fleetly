import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Load async data for list pages with loading + error state.
 * @param {() => Promise<unknown>} fetcher
 * @param {unknown[]} deps — dependency list for when to refetch (like useEffect)
 * @param {{ enabled?: boolean }} options
 */
export function useListFetch(fetcher, deps = [], options = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
      return result;
    } catch (e) {
      const msg = e?.message || 'Request failed';
      setError(msg);
      setData(null);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setData(null);
      setError(null);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const result = await fetcherRef.current();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Request failed');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls refetch via deps
  }, [enabled, ...deps]);

  return { data, setData, loading, error, setError, reload };
}
