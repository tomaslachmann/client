import { Store } from '../cache';
import { QueryEvent } from '../event/queryEvent';
import { StoreEvent } from '../event/storeEvent';
import { QueryKeyProps } from '../query';

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

  private bulkAct = (queryKeys: QueryKeyProps<T>[], onBackground: boolean) => {
    for (const queryKey of queryKeys) {   
      if (onBackground) {
        this.actUpdateQuery(queryKey);
      } else {
        this.actUpdateBackgroundQuery(queryKey);
      }
    }
  }

  private act = (queryKey: QueryKeyProps<T>, onBackground: boolean) => {
    if (onBackground) {
      this.actUpdateQuery(queryKey);
    } else {
      this.actUpdateBackgroundQuery(queryKey);
    }
  }

  private actUpdateBackgroundQuery = (queryKey: QueryKeyProps<T>) => {
    //if (this.shouldUpdateQuery(queryKey)) {
      const newKey = this.queryStore[queryKey.key].filter((q) => JSON.stringify(q) === JSON.stringify(queryKey));
      newKey.push(queryKey);
      this.queryStore[queryKey.key] = newKey;
      this.queryEvent.dispatch('FIRE_UPDATE_BACKGROUND', queryKey);
    //}
  }

  private actUpdateQuery = (queryKey: QueryKeyProps<T>) => {
    //if (this.shouldUpdateQuery(queryKey)) {
      const newKey = this.queryStore[queryKey.key].filter((q) => JSON.stringify(q) === JSON.stringify(queryKey));
      newKey.push(queryKey);
      this.queryStore[queryKey.key] = newKey;
      this.queryEvent.dispatch('FIRE_UPDATE', queryKey);
    //}
  }
}