import { QueryKeyProps } from "../query";

export type EventTypes = 'CREATE_QUERY_KEY' | 'UPDATE_QUERY_KEY' | 'BULK_UPDATE_QUERY' | 'UPDATE_QUERY' | 'CREATE_QUERY' | 'FIRE_UPDATE' | 'FIRE_UPDATE_BACKGROUND';

export class QueryEvent<T extends (...args: Parameters<T>) => ReturnType<T>> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  private listeners: Record<EventTypes, Function[]>;

  constructor() {
    this.listeners = {
      'CREATE_QUERY_KEY': [],
      'UPDATE_QUERY_KEY': [],
      'UPDATE_QUERY': [],
      'CREATE_QUERY': [],
      'BULK_UPDATE_QUERY': [],
      'FIRE_UPDATE': [],
      'FIRE_UPDATE_BACKGROUND': [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  addEventListener(eventName: EventTypes, listener: Function) {
    this.listeners[eventName].push(listener);
  }

  dispatch(eventName: EventTypes, value: QueryKeyProps<T> | QueryKeyProps<T>[] | string, refetch = false, background = false) {
    for (const listener of this.listeners[eventName]) {
      listener(value, refetch, background);
    }
  }
}