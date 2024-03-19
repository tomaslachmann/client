import { StoreEvent } from "../event/storeEvent";
import { IndexedDB } from "./IndexedDB";
import { LocalStorage } from "./LocalStorage";
import { SessionStorage } from "./SessionStorage";
import { validateCache } from "./utils";

export type Driver = 'localStorage' | 'sessionStorage' | 'indexedDB';

export type CacheConfig = {
  cacheResults: boolean,
  lifetime: number,
  storage: Driver,
  storageName?: string,
}

export type Item = {
  result: string,
  args: string,
  date: number,
  lifetime?: number,
  valid?: boolean,
  id: string,
}

export type Store = {
  [id: string]: Item[]
}

export const defaultCacheConfig: CacheConfig = {
  cacheResults: true,
  lifetime: 1800000,
  storage: 'localStorage',
  storageName: 'api-client'
}

export class CacheStore {
  private driver!: SessionStorage | LocalStorage | IndexedDB;
  public lifetime: number;
  private name: string;
  public lastClear: number;
  storeEvent: StoreEvent;

  constructor(config = defaultCacheConfig, store: Store, storeEvent: StoreEvent) {
    this.lifetime = config.lifetime || defaultCacheConfig.lifetime;
    this.name = config.storageName || defaultCacheConfig.storageName!;
    this.lastClear = Date.now();
    this.storeEvent = storeEvent;
    this.createStorage(store);
  }

  private createStorage(store: Store) {
    switch(this.name) {
      case 'sessionStorage':
        this.driver = new SessionStorage(this.name, store);
        break;
      case 'indexedDB':
        this.driver = new IndexedDB(this.name, store);
        break;
      default:
        this.driver = new LocalStorage(this.name, store);
        break;
    }
  }

  public setKey(id: string) {
    this.driver.setKey(id);
  }

  public getKeys() {
    return this.driver.getKeys();
  }

  public getItem(id: string) {
    return this.driver.getItem(id);
  }

  public getAll() {
    return this.driver.getAll();
  }

  public removeItem(id: string) {
    this.driver.removeItem(id);
  }

  public setItem(item: Item) {
    this.driver.setItem(item);
    this.storeEvent.dispatch('CREATE_ITEM', item);
  }

  public updateItem(item: Item) {
    this.driver.updateItem(item);
    this.storeEvent.dispatch('UPDATE_ITEM', item);
  }

  public setStore(store: Store) {
    this.driver.setStore(store);
  }

  public clean() {
    const keys = this.driver.getKeys();
    const newStore: Store = {};

    for (const key of keys) {
      this.driver.setKey(key);
      newStore[key] = [];
      const allItems = this.driver.getAll();
      for (const item of allItems) {
        if (validateCache(item, this.lifetime)) {
          newStore[key].push(item);
        }
      }
    }

    this.driver.setStore(newStore);
    this.lastClear = Date.now();
  }
}