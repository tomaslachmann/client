import { useState } from 'react';
import { RequestState } from '../types';

export type RequestResult<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  state: RequestState;
  data?: Awaited<ReturnType<T>>;
  error?: any;
};

const DEFAULT_REQUEST_RESULT = Object.freeze({
  state: 'loading',
  data: undefined,
  error: undefined,
});

export function useRequestResult<T extends (...args: Parameters<T>) => ReturnType<T>>() {
  const [ requestResult, setRequestResult ] = useState<RequestResult<T>>(DEFAULT_REQUEST_RESULT);

  function updateRequestResult ({ data, state, error }: RequestResult<T>) {
    setRequestResult((oldResult) => ({ ...oldResult, state, data, error }));
  }

  return { requestResult, updateRequestResult };
}