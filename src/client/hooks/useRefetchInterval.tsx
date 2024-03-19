import { useEffect, useMemo } from 'react';
import { useApiClient } from './useApiClient';
import { FetchQueryProps } from '../client';
import { hashObject } from '../utils';

export function useRefetchInterval<T extends (...args: Parameters<T>) => ReturnType<T>>(query: FetchQueryProps<T>) {
  const apiClient = useApiClient();
  const queryHash = useMemo(() => hashObject(query), [ query ]);

  useEffect(() => {
    if (query.options?.refetchInterval) {
      //Implementing the setInterval method
      const interval = setInterval(() => {
        if (query.options?.backgroundRefetch) {
          apiClient.refetchQueryOnBackgrond(query);
        } else {
          apiClient.refetchQuery(query);
        }
      }, query.options?.refetchInterval);

      return () => {
        clearInterval(interval);
      }
    }
  }, [ queryHash ]);
}