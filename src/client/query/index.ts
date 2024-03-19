import { QueryEvent } from "../event/queryEvent";
import { IdProps, RequestState } from "../types";
import { createId, extractParams } from "../utils/id";

export type QueryKeyProps<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  queryKey: IdProps<T>,
  state: RequestState,
  result?: ReturnType<T>,
  error?: any,
  queryFn: T,
}

export class Query<T extends (...args: Parameters<T>) => ReturnType<T>> {
  private queryStore;
  private queryEvent: QueryEvent<T>;

  constructor(queryStore: Record<string, QueryKeyProps<T>[]>, queryEvent: QueryEvent<T>) {
    this.queryStore = queryStore;
    this.queryEvent = queryEvent;
  }

  public refetchQuery(query: QueryKeyProps<T>, onBackground = false) {
    const key = createId(query.queryKey);
    const existingQueryKey = this.queryStore[key];
    const args = extractParams(query.queryKey);
    if (!existingQueryKey) {
      this.createQueryKey(key);
    }
    const existingQuery = existingQueryKey?.find((q) => JSON.stringify(extractParams(q.queryKey)) === JSON.stringify(args));
    if (existingQuery) {
      const newQueries = this.queryStore[key].filter((q) => q !== existingQuery);
      newQueries.push(query);
      this.queryStore[key] = newQueries;
      this.queryEvent.dispatch('UPDATE_QUERY', query, true, onBackground);
    } else {
      this.queryStore[key].push(query);
      this.queryEvent.dispatch('CREATE_QUERY', query, true, onBackground);
    }
  }

  public fetchQuery(query: QueryKeyProps<T>) {
    const key = createId(query.queryKey);
    const args = extractParams(query.queryKey);
    const existingQueryKey = this.queryStore[key];
    if (!existingQueryKey) {
      this.createQueryKey(key);
    }
    const existingQuery = existingQueryKey?.find((q) => JSON.stringify(extractParams(q.queryKey)) === JSON.stringify(args));
    if (existingQuery) {
      const newQueries = this.queryStore[key].filter((q) => q !== existingQuery);
      newQueries.push(query);
      this.queryStore[key] = newQueries;
      this.queryEvent.dispatch('UPDATE_QUERY', query);
    } else {
      this.queryStore[key].push(query);
      this.queryEvent.dispatch('CREATE_QUERY', query);
    }
  }

  public fetchQueries(queries: QueryKeyProps<T>[]) {
    for (const query of queries) {
      const key = createId(query.queryKey);
      const args = extractParams(query.queryKey);
      const existingQueryKey = this.queryStore[key];
      if (!existingQueryKey) {
        this.createQueryKey(key);
      }
      const existingQuery = existingQueryKey?.find((q) => JSON.stringify(extractParams(q.queryKey)) === JSON.stringify(args));
      if (existingQuery) {
        const newQueries = this.queryStore[key].filter((q) => q !== existingQuery);
        newQueries.push(query);
        this.queryStore[key] = newQueries;
      } else {
        this.queryStore[key].push(query);
      }
    }
    this.queryEvent.dispatch('BULK_UPDATE_QUERY', queries);
  }

  public refetchQueries(queries: QueryKeyProps<T>[], onBackground = false) {
    for (const query of queries) {
      const key = createId(query.queryKey);
      const args = extractParams(query.queryKey);
      const existingQueryKey = this.queryStore[key];
      if (!existingQueryKey) {
        this.createQueryKey(key);
      }
      const existingQuery = existingQueryKey?.find((q) => JSON.stringify(extractParams(q.queryKey)) === JSON.stringify(args));
      if (existingQuery) {
        const newQueries = this.queryStore[key].filter((q) => q !== existingQuery);
        newQueries.push(query);
        this.queryStore[key] = newQueries;
      } else {
        this.queryStore[key].push(query);
      }
    }
    this.queryEvent.dispatch('BULK_UPDATE_QUERY', queries, true, onBackground);
  }

  public setQueryKeys(queryKeys: Record<string, QueryKeyProps<T>[]>) {
    this.queryStore = queryKeys;
  }

  public setQueryKey(id: string, queryKeys: QueryKeyProps<T>[]) {
    this.queryStore[id] = queryKeys;
    this.queryEvent.dispatch('UPDATE_QUERY_KEY', queryKeys);
  }

  public setQuery(id: string, query: QueryKeyProps<T>) {
    const args = extractParams(query.queryKey);
    this.queryStore[id] = [ ...this.queryStore[id].filter((q) => JSON.stringify(extractParams(q.queryKey)) === JSON.stringify(args)), query ];
  }

  public getQueryKeys() {
    return this.queryStore;
  }

  public getQueryKey(queryKey: string) {
    return this.queryStore[queryKey];
  }

  public getQuery(queryKey: string, args?: Parameters<T>) {
    return this.queryStore[queryKey]?.find((q) => JSON.stringify(extractParams(q.queryKey)) === JSON.stringify(args));
  }

  public createQueryKey(queryKey: string) {
    this.queryStore[queryKey] = [];
    this.queryEvent.dispatch('CREATE_QUERY_KEY', queryKey);
  }
}