import { EventTypes, QueryEvent } from "../event/queryEvent";
import { IdProps, RequestState } from "../types";
import { createId, extractParams } from "../utils/id";

export type QueryKeyProps<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  queryKey: IdProps<T>,
  state?: RequestState,
  data?: ReturnType<T>,
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

  private updateQuery = (query: QueryKeyProps<T>, eventType: EventTypes, refetch = false, onBackground = false) => {
    const key = createId(query.queryKey);
    const args = extractParams(query.queryKey);
    
    if (!this.queryStore[key]) {
      this.createQueryKey(key);
    }
    
    const existingQueryKey = this.queryStore[key];
    const existingQuery = existingQueryKey.find((q) => JSON.stringify(extractParams(q.queryKey)) === JSON.stringify(args));
    if (existingQuery) {
      const newQueries = existingQueryKey.filter((q) => q !== existingQuery);
      newQueries.push(query);
      this.queryStore[key] = newQueries;
    } else {
      existingQueryKey.push(query);
      this.queryStore[key] = existingQueryKey;
    }
    this.queryEvent.dispatch(eventType, query, refetch, onBackground);
  }

  public refetchQuery = (query: QueryKeyProps<T>, onBackground = false) => {
    this.updateQuery(query, 'UPDATE_QUERY', true, onBackground);
  }

  public fetchQuery = (query: QueryKeyProps<T>) => { 
    this.updateQuery(query, 'CREATE_QUERY');
  }

  public fetchQueries = (queries: QueryKeyProps<T>[]) => { 
    for (const query of queries) {
      this.updateQuery(query, 'BULK_UPDATE_QUERY');
    }
  }

  public refetchQueries = (queries: QueryKeyProps<T>[], onBackground = false) => { 
    for (const query of queries) {
      this.updateQuery(query, 'BULK_UPDATE_QUERY', true, onBackground);
    }
  }

  public setQueryKeys = (queryKeys: Record<string, QueryKeyProps<T>[]>) => { 
    this.queryStore = queryKeys;
  }

  public setQueryKey = (id: string, queryKeys: QueryKeyProps<T>[]) => { 
    this.queryStore[id] = queryKeys;
    this.queryEvent.dispatch('UPDATE_QUERY_KEY', queryKeys);
  }

  public setQuery = (id: string, query: QueryKeyProps<T>) => { 
    const args = extractParams(query.queryKey);
    this.queryStore[id] = [ ...this.queryStore[id].filter((q) => JSON.stringify(extractParams(q.queryKey)) !== JSON.stringify(args)), query ];
  }

  public getQueryKeys = () => { 
    return this.queryStore;
  }

  public getQueryKey = (queryKey: string) => { 
    return this.queryStore[queryKey];
  }

  public getQuery = (queryKey: IdProps<T>) => { 
    const name = createId(queryKey);
    const args = extractParams(queryKey);
    const store = this.queryStore[name];
    if (args) {
      return store?.find((q) => JSON.stringify(extractParams(q.queryKey)) === JSON.stringify(args));
    }
  }

  public createQueryKey = (queryKey: string) => { 
    this.queryStore[queryKey] = [];
    this.queryEvent.dispatch('CREATE_QUERY_KEY', queryKey);
  }
}