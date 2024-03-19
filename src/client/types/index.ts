import { Config } from "../client";

export type RequestState = 'loading' | 'fetching' | 'success' | 'error' | 'idle' | 'invalidated';

export type IdProps<T extends (...args: Parameters<T>) => ReturnType<T>> = string | [string, ...Parameters<T>];

export type optionProps = {
  enabled: boolean,
};

export type QueryOptions = {
  enabled: boolean,
} & Omit<Config, 'cache'>;