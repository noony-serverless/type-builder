/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodSchema, ZodType } from 'zod';

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

// ============================================================================
// Advanced Type Utilities for IDE Autocomplete
// ============================================================================

/**
 * Capitalize first letter of a string type
 * Example: "name" -> "Name"
 */
type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

/**
 * Generate method name from property key
 * Example: "name" -> "withName"
 */
type WithMethodName<K extends string> = `with${Capitalize<K>}`;

/**
 * Generate all .withXYZ() methods for a given type T
 * Each method accepts the property's type and returns the builder for chaining
 */
type WithMethods<T> = {
  [K in keyof T & string as WithMethodName<K>]: (value: T[K]) => FluentBuilder<T>;
};

/**
 * Fluent builder with chainable .withXYZ() methods and .build()
 * Provides full IDE autocomplete for all properties
 */
export type FluentBuilder<T> = WithMethods<T> & {
  build(): T;
};

/**
 * Async version of FluentBuilder with .buildAsync()
 * Used for non-blocking validation with Zod schemas
 */
export type FluentAsyncBuilder<T> = WithMethods<T> & {
  buildAsync(): Promise<T>;
};

/**
 * Infer TypeScript type from Zod schema
 * Example: z.object({ id: z.number() }) -> { id: number }
 */
export type InferZodType<T> = T extends ZodType<infer U, any, any> ? U : never;
