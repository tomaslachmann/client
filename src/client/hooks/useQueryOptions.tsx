import { useMemo } from 'react';
import { QueryOptions } from '../types';
import { hashObject } from '../utils';

const DEFAULT_OPTIONS: QueryOptions = Object.freeze({
  enabled: true,
  refetchInterval: 1000 * 60 * 5,
  backgroundRefetch: false, 
  fetchOnMount: true,
});

export function useQueryOptions(options: Partial<QueryOptions>) {
  const optionsHash = useMemo(() => hashObject(options), [options]);

  const queryOptions = useMemo(() => {
    return {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  }, [ optionsHash ]);

  return {
    queryOptions,
    optionsHash,
  };
}