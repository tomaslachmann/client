import { Action } from './action';
import { CacheConfig, CacheStore } from './cache';
import { createCache, validateCache } from './cache/utils';
import { DataEvent } from './event/dataEvent';
import { QueryEvent } from './event/queryEvent';
import { StoreEvent } from './event/storeEvent';
import { Query, QueryKeyProps } from './query';
import { IdProps, QueryOptions, RequestState } from './types';
import { hashArray } from './utils';
import { createId, extractParams } from './utils/id';

export type Config = {
  cache?: CacheConfig,
  refetchInterval: number | false,
  backgroundRefetch: boolean,
  fetchOnMount: boolean,
};

type Options = {
  useNonCached?: boolean,
};

const DEFAULT_OPTIONS: Config = Object.freeze({
  refetchInterval: 1000 * 60 * 5,
  backgroundRefetch: false,
  fetchOnMount: true,
});

export type FetchQueryProps<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  queryFn: T,
  queryKey: IdProps<T>,
  state?: RequestState,
  data?: Awaited<ReturnType<T>>,
  error?: any,
  options?: QueryOptions,
}

export type DefaultFunction = (...args: any[]) => any;

export const AsyncFunction = async function () {}.constructor;

export class Client<T extends (...args: Parameters<T>) => ReturnType<T> = DefaultFunction> {
  private config: Config;
  private cacheStore: CacheStore;
  private query: Query<T>;
  public queryStore: Record<string, QueryKeyProps<T>[]>;
  private actions: Action<T>;
  public dataEvent: DataEvent<(...args: never) => any>;

  constructor(config?: Config) {
    const observableStorage = {};
    const storeEvent = new StoreEvent();
    this.cacheStore = new CacheStore(config?.cache, observableStorage, storeEvent);
    this.queryStore = {};
    const queryEvent = new QueryEvent<T>();
    queryEvent.addEventListener('FIRE_UPDATE', this.fireUpdate);
    queryEvent.addEventListener('FIRE_UPDATE_BACKGROUND', this.fireUpdateBg);
    this.query = new Query(this.queryStore, queryEvent);
    this.config = {
      ...DEFAULT_OPTIONS,
      ...config,
    };
    this.actions = new Action<T>(observableStorage, this.queryStore, queryEvent, storeEvent);
    this.dataEvent = new DataEvent();
  }

  private fireUpdate = async (query: QueryKeyProps<T>, refetch: boolean) => {
    const { queryKey, queryFn } = query;
    const name = createId(queryKey);
    const args = extractParams(queryKey);
    this.updateQueryState('loading', query);
    try {
      this.updateQueryState('fetching', query);
      const result = await this.executeQuery(queryFn, args, {}, name, refetch);
      this.updateQueryState('success', query, result);
    } catch(err) {
      this.updateQueryState('error', query, undefined, err);
    }
  }

  private fireUpdateBg = async (query: QueryKeyProps<T>, refetch: boolean) => {
    const { queryKey, queryFn } = query;
    const name = createId(queryKey);
    const args = extractParams(queryKey);
    try {
      const result = await this.executeQuery(queryFn, args, {}, name, refetch);
      this.updateQueryState('success', query, result);
    } catch(err) {
      this.updateQueryState('error', query, undefined, err);
    }
  }

  private updateQueryState = (
    state: RequestState,
    query: QueryKeyProps<T>,
    data?: ReturnType<T>,
    error?: any
  ) => {
    query.state = state;
    if (state === 'success') {
      query.data = data!;
    } else if (state === 'error') {
      query.error = error!;
    }
    const eventName = Array.isArray(query.queryKey) ? hashArray(query.queryKey) : query.queryKey;
    this.dataEvent.dispatch(eventName, state, query);
    const name = createId(query.queryKey);
    this.query.setQuery(name, query);
  };

  private executeQuery = async (
    queryFn: T,
    args: Parameters<T> | undefined,
    _options: Options,
    name: string,
    refetch = false,
  ) => {
      const now = Date.now();

      if ((this.cacheStore.lastClear + this.cacheStore.lifetime) < now) {
        this.cacheStore.clean();
      }

      this.cacheStore.setKey(name);
      
      const item = this.cacheStore.getItem(JSON.stringify(args));

      if (item && validateCache(item, this.cacheStore.lastClear) && !refetch) {
        return Promise.resolve(JSON.parse(item.result)) as ReturnType<T>;
      }

      const result = await queryFn(...args as unknown as Parameters<T>);
      const resultToStore = createCache(result, args as unknown as Parameters<T>);

      if (item) {
        this.cacheStore.updateItem(resultToStore);
      } else {
        this.cacheStore.setItem(resultToStore);
      }

      return result;
  }

  public fetchQuery = (args: FetchQueryProps<T>) => { 
    this.query.fetchQuery(args);
  }

  public refetchQueryOnBackgrond = (args: FetchQueryProps<T>) => { 
    this.query.refetchQuery(args, true);
  }

  public refetchQuery = (args: FetchQueryProps<T>) => { 
    this.query.refetchQuery(args);
  }

  public fetchQueries = (args: FetchQueryProps<T>[]) => { 
    this.query.fetchQueries(args);
  }

  public refetchQueries = (args: FetchQueryProps<T>[]) => { 
    this.query.refetchQueries(args);
  }

  public refetchQueriesOnBackground = (args: FetchQueryProps<T>[]) => { 
    this.query.refetchQueries(args, true);
  }

  public setQueryKeys = (queryKeys: Record<string, QueryKeyProps<T>[]>) => { 
    this.query.setQueryKeys(queryKeys);
  }

  public setQueryKey = (id: string, queryKeys: QueryKeyProps<T>[]) => { 
    this.query.setQueryKey(id, queryKeys);
  }

  public getQueryKeys = () => { 
    return this.query.getQueryKeys();
  }

  public getQueryKey = (queryKey: string) => { 
    return this.query.getQueryKey(queryKey);
  }

  public getQuery = (queryKey: IdProps<T>) => { 
    return this.query.getQuery(queryKey);
  }
}