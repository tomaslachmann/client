import { Item, Store } from ".";
import { StorageError } from "./Errors";

export class SessionStorage {
  private name: string;
  private store!: Store;
  private key!: string;
  
  constructor(name: string, store: Store) {
    this.name = name;
    this.key = '';
    this.store = store;
    this.init();
  }

  init() {
    this.initStorage();
  }

  private initStorage() {
    try {
      const result = sessionStorage.getItem(this.name);
      if (result) {
        Object.entries(JSON.parse(result)).forEach(([key, value]) => {
          this.store[key] = value as Item[];
        })
      }
    } catch {
      throw new StorageError();
    }
  }

  public setKey(id: string) {
    this.key = id;
    if (!this.store[id]) {
      this.store[id] = [];
      this.updateStorage();
    }
  }

  public getKeys() {
    try {
      return Object.keys(this.store);
    } catch {
      throw new StorageError(`Error while retrieving all items from storage with key: ${this.key}.`);
    }
  }

  public getAll() {
    try {
      return this.store[this.key];
    } catch {
      throw new StorageError(`Error while retrieving all items from storage with key: ${this.key}.`);
    }
  }

  public getItem(id: string) {
    try {
      return this.store[this.key].find((item) => item.id === id);
    } catch {
      throw new StorageError(`Error while retrieving item with id: ${id} from storage with key: ${this.key}.`);
    }
  }

  public removeItem(id: string) {
    try {
      const newStoreRow = this.store[this.key].filter((item) => item.id !== id);
      this.store[this.key] = newStoreRow;
      this.updateStorage();
    } catch {
      throw new StorageError(`Error while removing item with id: ${id} from storage with key: ${this.key}.`);
    }
  }

  public setItem(item: Item) {
    try {
      item.date = Date.now();
      if (!this.store[this.key]) {
        this.store[this.key] = [];
      }
      this.store[this.key].push(item);
      this.updateStorage();
    } catch {
      throw new StorageError(`Error while setting item: ${JSON.stringify(item)} to storage with key: ${this.key}.`);
    }
  }

  public updateItem(item: Item) {
    try {
      const newStoreRow = this.store[this.key].filter((curr) => curr.id !== item.id);
      item.date = Date.now();
      newStoreRow.push(item);
      this.store[this.key] = newStoreRow;
      this.updateStorage();
    } catch {
      throw new StorageError(`Error while setting item: ${JSON.stringify(item)} to storage with key: ${this.key}.`);
    }
  }

  private updateStorage() {
    try {
      sessionStorage.setItem(this.name, JSON.stringify(this.store));
    } catch {
      throw new StorageError(`Error while updating store!`);
    }
  }

  public setStore(store: Store) {
    try {
      sessionStorage.setItem(this.name, JSON.stringify(store));
    } catch {
      throw new StorageError(`Error while updating store!`);
    }
  }
}