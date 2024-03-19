import { QueryKeyProps } from "../query";
import { RequestState } from "../types";

export type EventTypes = 'UPDATE_DATA' | string;

export class DataEvent<T extends (...args: Parameters<T>) => ReturnType<T>> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  private listeners: Record<EventTypes, Function[]>;

  constructor() {
    this.listeners = {
      'UPDATE_DATA': [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  addEventListener = (eventName: EventTypes, listener: Function) => {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(listener);
  }

  removeEventListener = (eventName: EventTypes, listener: Function) => {
    this.listeners[eventName] = this.listeners[eventName].filter((l) => l !== listener);
  }

  dispatch = (eventName: EventTypes, type: RequestState, value: QueryKeyProps<T> | QueryKeyProps<T>[]) => {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    for (const listener of this.listeners[eventName]) {
      listener(value);
    }
  }
}