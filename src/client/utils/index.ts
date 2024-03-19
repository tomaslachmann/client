// Custom hashing function for arrays
export function hashArray(array: any[]): string {
  return array.map(item => JSON.stringify(item)).join('|');
}

// Custom hashing function for objects
export function hashObject<T extends Object>(obj: T) {
  const keys = Object.keys(obj).sort(); // Sort keys to ensure consistent hashing
  const hashValues = keys.map((key) => `${key}:${JSON.stringify(obj[key as keyof T])}`);
  return hashValues.join('|');
}