import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ClientContext } from './ClientProvider';
import { IdProps, QueryOptions, RequestState } from './types';
import { hashArray, hashObject } from './utils';

const DEFAULT_OPTIONS: QueryOptions = {
  enabled: true,
  refetchInterval: 1000 * 60 * 5,
  backgroundRefetch: false, 
  fetchOnMount: true,
};

type ClientProps<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  queryKey: IdProps<T>,
  queryFn: T,
  state?: RequestState,
  data?: Awaited<ReturnType<T>>,
}

type Props<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  clients: ClientProps<T>[],
  options?: Partial<Omit<QueryOptions, 'enabled'>>,
}

export function useClients<T extends (...args: Parameters<T>) => ReturnType<T>>({ clients, options = {} }: Props<T>) {
  const context = useContext(ClientContext);
  const { apiClient } = context;
  const [ error, setError ] = useState<Record<string, unknown>>({});

  const optionsHash = useMemo(() => hashObject(options), [options]);

  const queryOptions = useMemo(() => {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  }, [ optionsHash ]);

  const mappedClients = useMemo(() => clients.map(({ queryFn, queryKey }) => {
    return {
      queryFn,
      queryKey,
      state: 'loading' as RequestState,
      data: undefined,
    }
  }), [ clients ]);
  const [ data, setData ] = useState<Record<string, ReturnType<T>>>({});
  const [ requestState, setRequestState ] = useState<Record<string, RequestState>>({});

  const query = useCallback(async() => {
    apiClient.fetchQueries(mappedClients);
  }, [ mappedClients, apiClient ]);

  // Subscribe function
  function updateData(obj: { key: string, result: ReturnType<T>, state: RequestState, error: any }) {
    setRequestState(oldData => ({
      ...oldData,
      [obj.key]: obj.state,
    }));
    setData(oldData => ({
      ...oldData,
      [obj.key]: obj.result,
    }));
    setError(oldData => ({
      ...oldData,
      [obj.key]: obj.error,
    }));
  }
  
  // Effect that will subscribe to events.
  useEffect(() => {
    mappedClients.forEach(({ queryKey }) => {
      const eventId = Array.isArray(queryKey) ? hashArray(queryKey) : queryKey;
      apiClient.dataEvent.addEventListener(eventId, updateData);
    })

    return () => {
      mappedClients.forEach(({ queryKey }) => {
        const eventId = Array.isArray(queryKey) ? hashArray(queryKey) : queryKey;
        apiClient.dataEvent.removeEventListener(eventId, updateData);
      })
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
          apiClient.refetchQueriesOnBackground(mappedClients);
        } else {
          apiClient.refetchQueries(mappedClients);
        }
      }, queryOptions.refetchInterval);

      return () => {
        clearInterval(interval);
      }
    }
}, [ data, queryOptions.refetchInterval ]);

  return {
    apiClient,
    data,
    error,
    query,
    isLoading: Object.values(requestState).some((s) => s === 'loading'),
    isFetching: Object.values(requestState).some((s) => s === 'fetching'),
    isSuccess: Object.values(requestState).some((s) => s === 'success'),
    isError: Object.values(requestState).some((s) => s === 'error'),
    isIdle: clients.length === 0,
  }
}