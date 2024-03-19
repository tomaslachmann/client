import { Item, Store } from ".";
import { StorageError } from "./Errors";

export class IndexedDB {
  private name: string;
  private db!: IDBDatabase;
  private store!: Store;
  private objectStore!: IDBObjectStore;
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
    const request = indexedDB.open(this.name);

    request.onerror = () => {
      throw new StorageError('IndexedDB is not supported.');
    }
    request.onsuccess = () => {
      this.db = request.result;
    }

    request.onupgradeneeded = () => {
      this.db = request.result;

      if(this.db.objectStoreNames.contains('api-cache-table')) {
        this.objectStore = this.db.transaction('api-cache-table', 'readwrite').objectStore('api-cache-table');
      } else {
        this.objectStore = this.db.createObjectStore('api-cache-table', { keyPath: 'id' });
      }

      const result = JSON.parse(this.objectStore.getAll() as unknown as string);
      Object.entries(result).forEach(([key, value]) => {
        this.store[key] = value as Item[];
      })
    };
  }

  public setKey(id: string) {
    this.key = id;
    if (!this.store[this.key]) {
      this.store[this.key] = [];
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
      if (this.objectStore.getKey(this.key)) {
        this.objectStore.put(JSON.stringify(this.store), this.key);
      } else {
        this.objectStore.add(JSON.stringify(this.store), this.key);
      }
    } catch {
      throw new StorageError(`Error while updating store!`);
    }
  }

  public setStore(store: Store) {
    try {
      if (this.objectStore.getKey(this.key)) {
        this.objectStore.put(JSON.stringify(store), this.key);
      } else {
        this.objectStore.add(JSON.stringify(store), this.key);
      }
    } catch {
      throw new StorageError(`Error while updating store!`);
    }
  }
}