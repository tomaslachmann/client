import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ClientContext } from './ClientProvider';
import { createId, extractParams } from './utils/id';
import { IdProps, QueryOptions, RequestState } from './types';

const DEFAULT_OPTIONS: QueryOptions = {
  enabled: true,
  refetchInterval: 1000 * 60 * 5,
  backgroundRefetch: false, 
  fetchOnMount: true,
};

type Props<T> = {
  queryKey: IdProps<T>,
  queryFn: T,
  options?: Partial<QueryOptions>,
}

export function useClient<T extends (...args: Parameters<T>) => ReturnType<T>>({ queryKey, queryFn, options = {} }: Props<T>) {
  const context = useContext(ClientContext);
  const { apiClient } = context;
  const [ error, setError ] = useState<unknown>();
  const queryOptions = useMemo(() => {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  }, [ options ]);
  const id = useMemo(() => createId(queryKey), [ queryKey ]);
  const args = useMemo(() => extractParams<T>(queryKey) as Parameters<T>, [ queryKey ]);
  const [ data, setData ] = useState<Awaited<ReturnType<T>>>();
  const [ requestState, setRequestState ] = useState<RequestState>('loading');

  const query = useCallback(async() => {
    if (!queryOptions.enabled || !id) {
      setRequestState('idle');
      return;
    }

    apiClient.fetchQuery({ fn: queryFn, key: id, args, state: 'loading' });
  }, [options.enabled, id, apiClient, queryFn, args, requestState]);

  // Subscribe function
  function updateData(obj: { result: Awaited<ReturnType<T>>, state: RequestState, error: any }) {
    setRequestState(obj.state);
    setData(obj.result);
    setError(obj.error);
  }
  
  // Effect that will subscribe to events.
  useEffect(() => {
    const eventId = `${id}-${JSON.stringify(args)}`;
    apiClient.dataEvent.addEventListener(eventId, updateData);

    return () => {
      apiClient.dataEvent.removeEventListener(eventId, updateData);
    }
  }, []);

  // Effect that will fetch on mount, if there is in option
  useEffect(() => {
    if (queryOptions.fetchOnMount) {
      query();
    }
  }, [queryOptions.fetchOnMount, query]);

  // Effect that will refetch on interval, if not set to false
  useEffect(() => {
    if (queryOptions.refetchInterval && data) {
      //Implementing the setInterval method
      const interval = setInterval(() => {
        if (queryOptions.backgroundRefetch) {
          apiClient.refetchQueryOnBackgrond({fn: queryFn, key: id, args, state: requestState});
        } else {
          apiClient.refetchQuery({ fn: queryFn, key: id, args, state: requestState });
        }
      }, queryOptions.refetchInterval);

      return () => {
        clearInterval(interval);
      }
    }
}, [data, queryOptions.refetchInterval]);

  return {
    apiClient,
    data,
    error,
    query,
    isLoading: requestState === 'loading',
    isFetching: requestState === 'fetching',
    isSuccess: requestState === 'success',
    isError: requestState === 'error',
    isIdle: requestState === 'idle',
  }
}