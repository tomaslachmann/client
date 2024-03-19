import { Action } from './action';
import { CacheConfig, CacheStore } from './cache';
import { createCache, validateCache } from './cache/utils';
import { DataEvent } from './event/dataEvent';
import { QueryEvent } from './event/queryEvent';
import { StoreEvent } from './event/storeEvent';
import { Query, QueryKeyProps } from './query';
import { RequestState } from './types';

export const AsyncFunction = async function () {}.constructor;

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
  fn: T,
  key: string,
  args: Parameters<T>,
  state: RequestState,
  result?: ReturnType<T>,
}

export class Client<T extends (...args: Parameters<T>) => ReturnType<T>> {
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

  private fireUpdate = async (queryKey: QueryKeyProps<T>) => {
    const fn = this.createAsyncWrapper(queryKey.fn, {}, queryKey.key);
    const index = this.queryStore[queryKey.key].indexOf(queryKey);
    const eventName = `${queryKey.key}-${JSON.stringify(queryKey.args)}`;
    queryKey.state = 'loading';
    this.dataEvent.dispatch(eventName, 'LOADING', queryKey);
    try {
      queryKey.state = 'fetching';
      this.dataEvent.dispatch(eventName, 'FETCHING', queryKey);
      const result = await fn(...queryKey.args);
      queryKey.state = 'success';
      queryKey.result = result;
      this.dataEvent.dispatch(eventName, 'SUCCESS', queryKey);
    } catch(err) {
      queryKey.state = 'error';
      queryKey.error = err;
      this.dataEvent.dispatch(eventName, 'ERROR', queryKey);
    }
    this.queryStore[queryKey.key][index] = queryKey;
  }

  private fireUpdateBg = async (queryKey: QueryKeyProps<T>) => {
    const fn = this.createAsyncWrapper(queryKey.fn, {}, queryKey.key);
    const index = this.queryStore[queryKey.key].indexOf(queryKey);
    const eventName = `${queryKey.key}-${JSON.stringify(queryKey.args)}`;
    try {
      const result = await fn(...queryKey.args);
      queryKey.state = 'success';
      queryKey.result = result;
      this.dataEvent.dispatch(eventName, 'SUCCESS', queryKey);
    } catch(err) {
      queryKey.state = 'error';
      queryKey.error = err;
      this.dataEvent.dispatch(eventName, 'ERROR', queryKey);
    }
    this.queryStore[queryKey.key][index] = queryKey;
  }

  private createAsyncWrapper<T extends (...args: Parameters<T>) => ReturnType<T>>(
    originalFunction: T,
    _options: Options,
    name: string,
    refetch = false,
  ) {
    return async (...args: Parameters<T>) => {
      const now = Date.now();

      if ((this.cacheStore.lastClear + this.cacheStore.lifetime) < now) {
        this.cacheStore.clean();
      }

      this.cacheStore.setKey(name);
      
      const item = this.cacheStore.getItem(JSON.stringify(args));

      if (item && validateCache(item, this.cacheStore.lastClear) && !refetch) {
        return Promise.resolve(JSON.parse(item.result)) as ReturnType<T>;
      }

      const result = await originalFunction(...args);
      const resultToStore = createCache(result, args);

      if (item) {
        this.cacheStore.updateItem(resultToStore);
      } else {
        this.cacheStore.setItem(resultToStore);
      }

      return result;
    };
  }

  public fetchQuery(args: FetchQueryProps<T>) {
    this.query.fetchQuery(args);
  }

  public refetchQueryOnBackgrond(args: FetchQueryProps<T>) {
    this.query.refetchQuery(args, true);
  }

  public refetchQuery(args: FetchQueryProps<T>) {
    this.query.refetchQuery(args);
  }

  public fetchQueries(args: FetchQueryProps<T>[]) {
    this.query.fetchQueries(args);
  }

  public refetchQueries(args: FetchQueryProps<T>[]) {
    this.query.refetchQueries(args);
  }

  public refetchQueriesOnBackground(args: FetchQueryProps<T>[]) {
    this.query.refetchQueries(args, true);
  }

  public setQueryKeys(queryKeys: Record<string, QueryKeyProps<T>[]>) {
    this.query.setQueryKeys(queryKeys);
  }

  public setQueryKey(id: string, queryKeys: QueryKeyProps<T>[]) {
    this.query.setQueryKey(id, queryKeys);
  }

  public getQueryKeys() {
    return this.query.getQueryKeys();
  }

  public getQueryKey(key: string) {
    return this.query.getQueryKey(key);
  }

  public getQuery(key: string, args?: Parameters<T>) {
    return this.query.getQuery(key, args);
  }
}