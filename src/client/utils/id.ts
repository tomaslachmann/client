import { IdProps } from '../types';

export function createId<T extends (...args: Parameters<T>) => ReturnType<T>>(idProps: IdProps<T>) {
  if (typeof idProps === 'string') {
    return idProps;
  } return idProps[0] as string;
}

export function extractParams<T extends (...args: Parameters<T>) => ReturnType<T>>(idProps: IdProps<T>): Parameters<T> | undefined {
  if (typeof idProps === 'string') {
    return;
  } else if (idProps.length === 1 && typeof idProps[0] === 'string') {
    return;
  } else {
    return idProps.filter((_prop, i) => i !== 0) as Parameters<T>;
  }
}