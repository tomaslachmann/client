import { useCallback, useContext, useMemo, useState } from 'react';
import { ClientContext } from './ClientProvider';
import { createId, extractParams } from './utils/id';
import { IdProps, RequestState, optionProps } from './types';

const defaultOptions: optionProps = Object.freeze({
  enabled: true,
});

type Options = {
  enabled: boolean,
};

type Props<T> = {
  mutationKey: IdProps<T>,
  mutationFn: T,
  onSuccess?: () => void,
  onError?: () => void,
  options: Options,
}

export function useMutation<T extends (...args: Parameters<T>) => ReturnType<T>>({ mutationKey, mutationFn, onSuccess, onError, options = defaultOptions }: Props<T>) {
  const context = useContext(ClientContext);
  const { apiClient } = context;
  const [ requestState, setRequestState ] = useState<RequestState>('loading');
  const [ error, setError ] = useState<unknown>();
  const [ data, setData ] = useState<ReturnType<T>>();
  const id = useMemo(() => createId(mutationKey), [ mutationKey ]);
  const fn = useMemo(() => {
    if (id) {
      return apiClient.createAsyncWrapper(mutationFn, {}, id);
    }
  }, [apiClient, mutationFn, id]);

  const query = useCallback(async() => {
    if (!options.enabled || !fn) {
      setRequestState('idle');
      return;
    }
    try {
      setRequestState('fetching');
      const data = await fn(...extractParams<T>(mutationKey) as Parameters<T>);
      setRequestState('success');
      setData(data);
      if(onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setRequestState('error');
      setError(err);
      if (onError) {
        onError();
      }
    }
  }, [options.enabled, fn, mutationKey, onSuccess, onError]);

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