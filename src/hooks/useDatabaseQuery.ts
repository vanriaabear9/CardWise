import { useCallback, useEffect, useRef, useState } from 'react';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';

import { subscribeToDataChanges } from '@/services/dataEvents';
import { getErrorMessage } from '@/services/errors';

export interface DatabaseQueryState<T> {
  data: T;
  isLoading: boolean;
  /** A readable error message, or null if the last load succeeded. */
  error: string | null;
  reload: () => void;
}

/**
 * Runs a read query and keeps the result up to date.
 * Reloads automatically whenever a service reports that data changed.
 *
 * `query` must be a stable function (a module-level service function or wrapped in useCallback).
 */
export function useDatabaseQuery<T>(
  query: (db: SQLiteDatabase) => Promise<T>,
  initialData: T,
): DatabaseQueryState<T> {
  const db = useSQLiteContext();
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only the latest request may update state (prevents out-of-order results
  // and updates after the screen is gone).
  const latestRequest = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      const result = await query(db);
      if (requestId === latestRequest.current) {
        setData(result);
        setError(null);
      }
    } catch (loadError) {
      if (requestId === latestRequest.current) {
        console.warn('[useDatabaseQuery] Load failed:', loadError);
        setError(getErrorMessage(loadError));
      }
    } finally {
      if (requestId === latestRequest.current) {
        setIsLoading(false);
      }
    }
  }, [db, query]);

  useEffect(() => {
    void load();
    const unsubscribe = subscribeToDataChanges(() => {
      void load();
    });
    return () => {
      unsubscribe();
      latestRequest.current += 1; // ignore any request still in flight
    };
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, reload };
}
