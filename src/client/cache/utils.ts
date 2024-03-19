import { Item } from ".";

export function createCache<T extends (...args: Parameters<T>) => ReturnType<T>>(result: ReturnType<T>, args: Parameters<T>): Item {
  return {
    id: JSON.stringify(args),
    result: JSON.stringify(result),
    args: JSON.stringify(args),
    date: Date.now(),
  };
}

export function validateCache(item: Item, lifetime: number) {
  const now = Date.now();
  if (item.lifetime) {
    return now < (item.date + item.lifetime);
  }
  return now < (item.date + lifetime);
}