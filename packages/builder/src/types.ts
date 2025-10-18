import { ZodSchema } from 'zod';

export type BuilderType = 'zod' | 'class' | 'interface';

export interface BuilderConfig {
  type: BuilderType;
  keys?: string[];
  schema?: ZodSchema;
  constructor?: new (...args: any[]) => any;
}

export interface BuilderInstance<T = any> {
  [key: string]: any;
  build(): T;
}

export interface AsyncBuilderInstance<T = any> {
  [key: string]: any;
  buildAsync(): Promise<T>;
}

export type BuilderFunction<T = any> = () => BuilderInstance<T>;
export type AsyncBuilderFunction<T = any> = () => AsyncBuilderInstance<T>;

export interface ObjectPool<T> {
  get(): T;
  release(obj: T): void;
  clear(): void;
  size(): number;
}

export interface PerformanceMetrics {
  operationsPerSecond: number;
  averageTimePerOperation: number;
  memoryUsage: number;
  gcPressure: number;
}
