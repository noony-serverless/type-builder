import { createBuilder, createAsyncBuilder, clearPools, getPoolStats } from './factory';
import { FastObjectPool, BuilderPool } from './object-pool';
import { detectBuilderType, isZodSchema, isClass } from './detection';
export type { 
  BuilderType, 
  BuilderConfig, 
  BuilderInstance, 
  AsyncBuilderInstance, 
  BuilderFunction, 
  AsyncBuilderFunction,
  ObjectPool,
  PerformanceMetrics
} from './types';

// Re-export everything
export { createBuilder, createAsyncBuilder, clearPools, getPoolStats };
export { FastObjectPool, BuilderPool };
export { detectBuilderType, isZodSchema, isClass };

// Main builder function with auto-detection
export function builder<T = any>(
  input: any,
  explicitKeys?: string[]
) {
  return createBuilder<T>(input, explicitKeys);
}

// Async builder function for non-blocking validation
export function builderAsync<T = any>(
  input: any,
  explicitKeys?: string[]
) {
  return createAsyncBuilder<T>(input, explicitKeys);
}

// Default export for convenience
export default builder;
