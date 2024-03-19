import { useCallback, useEffect, useMemo } from 'react';
import { useApiClient } from './useApiClient';
import { RequestResult } from './useRequestResult';
import { FetchQueryProps } from '../client';
import { hashArray, hashObject } from '../utils';

type CallbackProps<T extends (...args: Parameters<T>) => ReturnType<T>> = (args: RequestResult<T>) => void;

export function useFetch<T extends (...args: Parameters<T>) => ReturnType<T>>(callback: CallbackProps<T>, queryObj: FetchQueryProps<T>) {
  const apiClient = useApiClient();

  const queryObjHash = useMemo(() => hashObject(queryObj), [ queryObj ]);

  const query = useCallback(async() => {
    if (!queryObj.options?.enabled) {
      callback({ data: queryObj.data, error: queryObj.error, state: 'idle' });
      return;
    }

    apiClient.fetchQuery({ ...queryObj, state: 'loading' });
  }, [ apiClient, queryObjHash ]);

  // Effect that will subscribe to events.
  useEffect(() => {
    const eventId = Array.isArray(queryObj.queryKey) ? hashArray(queryObj.queryKey) : queryObj.queryKey;
    apiClient.dataEvent.addEventListener(eventId, callback);

    return () => {
      apiClient.dataEvent.removeEventListener(eventId, callback);
    }
  }, [ queryObjHash, callback ]);

    
  // Effect that will fetch on mount, if there is in option
  useEffect(() => {
    if (queryObj.options?.fetchOnMount) {
      query();
    }
  }, [ queryObjHash, query ]);

  return {
    query,
  }
}