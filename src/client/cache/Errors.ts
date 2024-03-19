export class StorageError extends Error {
  constructor(message: string = 'Storage is not supported.') {
    super(message);
  }
}