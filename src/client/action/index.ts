import { Store } from '../cache';
import { QueryEvent } from '../event/queryEvent';
import { StoreEvent } from '../event/storeEvent';
import { QueryKeyProps } from '../query';
import { createId } from '../utils/id';

export class Action<T extends (...args: Parameters<T>) => ReturnType<T>> {
  cacheStore: Store;
  queryStore: Record<string, QueryKeyProps<T>[]>;
  queryEvent: QueryEvent<T>;
  storeEvent: StoreEvent;

  constructor(store: Store, query: Record<string, QueryKeyProps<T>[]>, queryEvent: QueryEvent<T>, storeEvent: StoreEvent) {
    this.cacheStore = store;
    this.queryStore = query;
    this.queryEvent = queryEvent;
    this.storeEvent = storeEvent;
    this.queryEvent.addEventListener('CREATE_QUERY', this.act);
    this.queryEvent.addEventListener('UPDATE_QUERY', this.act);
    this.queryEvent.addEventListener('BULK_UPDATE_QUERY', this.bulkAct);
  }

  private bulkAct = (queries: QueryKeyProps<T>[], refetch: boolean, onBackground: boolean) => {
    for (const query of queries) {   
      if (onBackground) {
        this.actUpdateBackgroundQuery(query, refetch);
      } else {
        this.actUpdateQuery(query, refetch);
      }
    }
  }

  private act = (query: QueryKeyProps<T>, refetch: boolean, onBackground: boolean) => {
    if (onBackground) {
      this.actUpdateBackgroundQuery(query, refetch);
    } else {
      this.actUpdateQuery(query, refetch);
    }
  }

  private actUpdateBackgroundQuery = (query: QueryKeyProps<T>, refetch: boolean) => {
    //if (this.shouldUpdateQuery(query)) {
      const name = createId(query.queryKey);
      const newKey = this.queryStore[name].filter((q) => JSON.stringify(q) === JSON.stringify(query));
      newKey.push(query);
      this.queryStore[name] = newKey;
      this.queryEvent.dispatch('FIRE_UPDATE_BACKGROUND', query, refetch);
    //}
  }

  private actUpdateQuery = (query: QueryKeyProps<T>, refetch: boolean) => {
    //if (this.shouldUpdateQuery(query)) {
      const name = createId(query.queryKey);
      const newQueries = this.queryStore[name].filter((q) => JSON.stringify(q) === JSON.stringify(query));
      newQueries.push(query);
      this.queryStore[name] = newQueries;
      this.queryEvent.dispatch('FIRE_UPDATE', query, refetch);
    //}
  }
}