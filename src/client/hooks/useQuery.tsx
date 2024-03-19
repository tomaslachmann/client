import { IdProps, QueryOptions } from '../types';
import { useRequestResult } from './useRequestResult';
import { useRefetchInterval } from './useRefetchInterval';
import { useFetch } from './useFetch';
import { useQueryOptions } from './useQueryOptions';

type Props<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  queryKey: IdProps<T>,
  queryFn: T,
  options?: Partial<QueryOptions>,
}

export function useQuery<T extends (...args: Parameters<T>) => ReturnType<T>>({ queryKey, queryFn, options = {} }: Props<T>) {
  const { queryOptions } = useQueryOptions(options);
  const { requestResult, updateRequestResult } = useRequestResult<T>();
  const { query } = useFetch(updateRequestResult, { queryFn, queryKey, state: 'loading', options: queryOptions });
  useRefetchInterval({ queryFn, queryKey, state: requestResult.state, options: queryOptions });

  return {
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