/* eslint-disable react-refresh/only-export-components */
import { createContext, memo, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Client, FetchQueryProps } from './client';
import { IdProps, QueryOptions } from './types';
import { createId } from './utils/id';
import { QueryKeyProps } from './query';

type QueryProps<T extends (...args: Parameters<T>) => ReturnType<T>> = (key: IdProps<T>, fn: T, options: QueryOptions, args: Parameters<T>) => ReturnType<T>;

type ContextType<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  apiClient: Client<T>,
  //invalidateQueries: (queryKey: IdProps<T>) => void,
  fetch: (arg: FetchQueryProps<T>) => void,
  refetch: (arg: FetchQueryProps<T>) => void,
  bulkFetch: (args: FetchQueryProps<T>[]) => void,
  bulkRefetch: (args: FetchQueryProps<T>[]) => void,
  getQuery: (queryKey: IdProps<T>) => QueryKeyProps<T> | undefined,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ClientContext = createContext<ContextType<any>>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiClient: {} as Client<any>,
  //invalidateQueries: () => {},
  fetch: () => {},
  refetch: () => {},
  bulkFetch: () => {},
  bulkRefetch: () => {},
  getQuery: (queryKey: IdProps<any>) => undefined,
});

type ClientProviderProps<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  children: ReactNode,
  client: Client<T>,
}

export const ClientProvider = memo(function ClientProvider<T extends (...args: Parameters<T>) => ReturnType<T>>({ children, client }: ClientProviderProps<T>) {
  const apiClient = useMemo<Client<T>>(() => client, [client]);

  const invalidateQueries = useCallback((key: IdProps<T>) => {
    const queryKeys = apiClient.getQueryKey(createId(key));
  }, []);
  console.log(apiClient);
  return (
    // @ts-ignore
    <ClientContext.Provider value={{ apiClient, fetch: apiClient.fetchQuery, refetch: apiClient.refetchQuery, bulkFetch: apiClient.fetchQueries, bulkRefetch: apiClient.refetchQueries, getQuery: apiClient.getQuery }}>
      {children}
    </ClientContext.Provider>
  );
});

export function useClient() {
  return useContext(ClientContext);
}
