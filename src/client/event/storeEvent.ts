import { Item } from "../cache";

export type EventTypes = 'UPDATE_ITEM' | 'CREATE_ITEM';

export class StoreEvent {
  // eslint-disable-next-line @typescript-eslint/ban-types
  private listeners: Record<EventTypes, Function[]>;

  constructor() {
    this.listeners = {
      'UPDATE_ITEM': [],
      'CREATE_ITEM': [],
    };
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  addEventListener(eventName: EventTypes, listener: Function) {
    this.listeners[eventName].push(listener);
  }

  dispatch(eventName: EventTypes, value: Item) {
    for (const listener of this.listeners[eventName]) {
      listener(value);
    }
  }
}