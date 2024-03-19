import { QueryEvent } from "../event/queryEvent";
import { StoreEvent } from "../event/storeEvent";
import { RequestState } from "../types";

export type QueryKeyProps<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  key: string,
  args: Parameters<T>,
  state: RequestState,
  result?: ReturnType<T>,
  error?: any,
  fn: T,
}

export class Query<T extends (...args: Parameters<T>) => ReturnType<T>> {
  private queryStore;
  queryEvent: QueryEvent<T>;

  constructor(queryStore: Record<string, QueryKeyProps<T>[]>, queryEvent: QueryEvent<T>) {
    this.queryStore = queryStore;
    this.queryEvent = queryEvent;
  }

  public refetchQuery(queryKey: QueryKeyProps<T>, onBackground = false) {
    const existingQueryKey = this.queryStore[queryKey.key];
    if (!existingQueryKey) {
      this.createQueryKey(queryKey.key);
    }
    const existingQuery = existingQueryKey?.find((q) => JSON.stringify(q.args) === JSON.stringify(queryKey.args));
    if (existingQuery) {
      const newQueries = this.queryStore[queryKey.key].filter((q) => q !== existingQuery);
      newQueries.push(queryKey);
      this.queryStore[queryKey.key] = newQueries;
      this.queryEvent.dispatch('UPDATE_QUERY', queryKey, true, onBackground);
    } else {
      this.queryStore[queryKey.key].push(queryKey);
      this.queryEvent.dispatch('CREATE_QUERY', queryKey, true, onBackground);
    }
  }

  public fetchQuery(queryKey: QueryKeyProps<T>) {
    const existingQueryKey = this.queryStore[queryKey.key];
    if (!existingQueryKey) {
      this.createQueryKey(queryKey.key);
    }
    const existingQuery = existingQueryKey?.find((q) => JSON.stringify(q.args) === JSON.stringify(queryKey.args));
    if (existingQuery) {
      const newQueries = this.queryStore[queryKey.key].filter((q) => q !== existingQuery);
      newQueries.push(queryKey);
      this.queryStore[queryKey.key] = newQueries;
      this.queryEvent.dispatch('UPDATE_QUERY', queryKey);
    } else {
      this.queryStore[queryKey.key].push(queryKey);
      this.queryEvent.dispatch('CREATE_QUERY', queryKey);
    }
  }

  public fetchQueries(queryKeys: QueryKeyProps<T>[]) {
    for (const queryKey of queryKeys) {
      const existingQueryKey = this.queryStore[queryKey.key];
      if (!existingQueryKey) {
        this.createQueryKey(queryKey.key);
      }
      const existingQuery = existingQueryKey?.find((q) => JSON.stringify(q.args) === JSON.stringify(queryKey.args));
      if (existingQuery) {
        const newQueries = this.queryStore[queryKey.key].filter((q) => q !== existingQuery);
        newQueries.push(queryKey);
        this.queryStore[queryKey.key] = newQueries;
      } else {
        this.queryStore[queryKey.key].push(queryKey);
      }
    }
    this.queryEvent.dispatch('BULK_UPDATE_QUERY', queryKeys);
  }

  public refetchQueries(queryKeys: QueryKeyProps<T>[], onBackground = false) {
    for (const queryKey of queryKeys) {
      const existingQueryKey = this.queryStore[queryKey.key];
      if (!existingQueryKey) {
        this.createQueryKey(queryKey.key);
      }
      const existingQuery = existingQueryKey?.find((q) => JSON.stringify(q.args) === JSON.stringify(queryKey.args));
      if (existingQuery) {
        const newQueries = this.queryStore[queryKey.key].filter((q) => q !== existingQuery);
        newQueries.push(queryKey);
        this.queryStore[queryKey.key] = newQueries;
      } else {
        this.queryStore[queryKey.key].push(queryKey);
      }
    }
    this.queryEvent.dispatch('BULK_UPDATE_QUERY', queryKeys, true, onBackground);
  }

  public setQueryKeys(queryKeys: Record<string, QueryKeyProps<T>[]>) {
    this.queryStore = queryKeys;
  }

  public setQueryKey(id: string, queryKeys: QueryKeyProps<T>[]) {
    this.queryStore[id] = queryKeys;
    this.queryEvent.dispatch('UPDATE_QUERY_KEY', queryKeys);
  }

  public setQuery(id: string, queryKey: QueryKeyProps<T>) {
    this.queryStore[id] = [ ...this.queryStore[id].filter((q) => JSON.stringify(q.args) === JSON.stringify(queryKey.args)), queryKey ];
  }

  public getQueryKeys() {
    return this.queryStore;
  }

  public getQueryKey(key: string) {
    return this.queryStore[key];
  }

  public getQuery(key: string, args?: Parameters<T>) {
    return this.queryStore[key]?.find((q) => JSON.stringify(q.args) === JSON.stringify(args));
  }

  public createQueryKey(key: string) {
    this.queryStore[key] = [];
    this.queryEvent.dispatch('CREATE_QUERY_KEY', key);
  }
  
}