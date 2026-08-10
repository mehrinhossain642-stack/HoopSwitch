import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs the fetch. Safe to call from pull-to-refresh or after a mutation. */
  refetch: () => void;
  /** Replaces the local copy without a round trip (for optimistic updates). */
  setData: (next: T) => void;
};

/**
 * Minimal data-fetching hook: loading / error / refetch, with out-of-order and
 * unmount protection. Deliberately not a cache — at this size, refetching after
 * a mutation is simpler to reason about than invalidation.
 *
 * `deps` behaves like a useEffect dependency list: change them and it refetches.
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  // Guards against a slow earlier request overwriting a newer one.
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!mounted.current || id !== requestId.current) return;
        setData(result);
      })
      .catch((caught: unknown) => {
        if (!mounted.current || id !== requestId.current) return;
        setError(
          caught instanceof ApiError
            ? caught.errors.join('\n')
            : caught instanceof Error
              ? caught.message
              : 'Something went wrong'
        );
      })
      .finally(() => {
        if (!mounted.current || id !== requestId.current) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, refetch, setData };
}

/** Normalizes any thrown value into a user-facing message. */
export function errorMessage(caught: unknown): string {
  if (caught instanceof ApiError) return caught.errors.join('\n');
  if (caught instanceof Error) return caught.message;
  return 'Something went wrong';
}
