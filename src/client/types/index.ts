import { Config } from "../client";

export type RequestState = 'loading' | 'fetching' | 'success' | 'error' | 'idle' | 'invalidated';

export type IdProps<T> = string | (string | T)[];

export type optionProps = {
  enabled: boolean,
};

export type QueryOptions = {
  enabled: boolean,
} & Omit<Config, 'cache'>;