import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ClientContext } from './ClientProvider';
import { IdProps, QueryOptions, RequestState } from './types';
import { hashArray, hashObject } from './utils';

const DEFAULT_OPTIONS: QueryOptions = Object.freeze({
  enabled: true,
  refetchInterval: 1000 * 60 * 5,
  backgroundRefetch: false, 
  fetchOnMount: true,
});

type Props<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  queryKey: IdProps<T>,
  queryFn: T,
  options?: Partial<QueryOptions>,
}

type RequestResult<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  state: RequestState,
  data?: Awaited<ReturnType<T>>,
  error?: any,
}

const DEFAULT_REQUEST_RESULT = Object.freeze({
  state: 'loading',
  data: undefined,
  error: undefined,
});

export function useQuery<T extends (...args: Parameters<T>) => ReturnType<T>>({ queryKey, queryFn, options = {} }: Props<T>) {
  const context = useContext(ClientContext);
  const { apiClient } = context;

  const optionsHash = useMemo(() => hashObject(options), [options]);

  const queryOptions = useMemo(() => {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  }, [ optionsHash ]);

  const queryKeyHash = useMemo(() => Array.isArray(queryKey) ? hashArray(queryKey) : queryKey, [ queryKey ]);

  const [ requestResult, setRequestResult ] = useState<RequestResult<T>>(DEFAULT_REQUEST_RESULT);

  const query = useCallback(async() => {
    if (!queryOptions.enabled) {
      setRequestResult((oldResult) => ({
        ...oldResult,
        state: 'idle',
      }));
      return;
    }

    apiClient.fetchQuery({ queryFn, queryKey, state: 'loading' });
  }, [ queryOptions, apiClient, queryKeyHash, queryFn ]);

  // Subscribe function
  function updateData(obj: { result: Awaited<ReturnType<T>>, state: RequestState, error: any }) {
    setRequestResult((oldResult) => ({
      ...oldResult,
      state: obj.state,
      data: obj.result,
      error: obj.error,
    }))
  }
  
  // Effect that will subscribe to events.
  useEffect(() => {
    const eventId = queryKeyHash;
    apiClient.dataEvent.addEventListener(eventId, updateData);

    return () => {
      apiClient.dataEvent.removeEventListener(eventId, updateData);
    }
  }, [ queryKeyHash ]);

  // Effect that will fetch on mount, if there is in option
  useEffect(() => {
    if (queryOptions.fetchOnMount) {
      query();
    }
  }, [ queryOptions.enabled, query ]);

  // Effect that will refetch on interval, if not set to false
  useEffect(() => {
    if (queryOptions.refetchInterval && requestResult.data) {
      //Implementing the setInterval method
      const interval = setInterval(() => {
        if (queryOptions.backgroundRefetch) {
          apiClient.refetchQueryOnBackgrond({queryFn, queryKey, state: requestResult.state});
        } else {
          apiClient.refetchQuery({ queryFn, queryKey, state: requestResult.state });
        }
      }, queryOptions.refetchInterval);

      return () => {
        clearInterval(interval);
      }
    }
}, [requestResult.data, queryOptions.refetchInterval]);

  return {
    apiClient,
    data: requestResult.data,
    error: requestResult.error,
    query,
    isLoading: requestResult.state === 'loading',
    isFetching: requestResult.state === 'fetching',
    isSuccess: requestResult.state === 'success',
    isError: requestResult.state === 'error',
    isIdle: requestResult.state === 'idle',
  }
}