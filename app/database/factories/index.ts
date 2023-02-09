export interface ModelFactory<T> {
  build: (data: Partial<T>) => Promise<Omit<T, 'id'>>;
  create: (data: Partial<T>) => Promise<T>;
}