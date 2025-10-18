import { ZodSchema } from 'zod';
import { 
  BuilderConfig, 
  BuilderFunction, 
  AsyncBuilderFunction, 
  BuilderInstance, 
  AsyncBuilderInstance 
} from './types';
import { createBuilderConfig, extractKeysFromZod, extractKeysFromClass } from './detection';
import { InterfaceBuilder } from './builders/interface-builder';
import { ClassBuilder } from './builders/class-builder';
import { ZodBuilder, AsyncZodBuilder } from './builders/zod-builder';
import { BuilderPool } from './object-pool';

const builderPools = new Map<string, BuilderPool<any>>();
const asyncBuilderPools = new Map<string, BuilderPool<any>>();

function getPoolKey(config: BuilderConfig): string {
  return `${config.type}-${config.keys?.join(',') || 'default'}`;
}

function createBuilderInstance<T>(config: BuilderConfig): BuilderInstance<T> {
  const keys = config.keys || [];
  
  switch (config.type) {
    case 'interface':
      return new InterfaceBuilder<T>(keys).createProxy();
      
    case 'class':
      if (!config.constructor) {
        throw new Error('Class constructor is required for class builder');
      }
      return new ClassBuilder<T>(keys, config.constructor).createProxy();
      
    case 'zod':
      if (!config.schema) {
        throw new Error('Zod schema is required for zod builder');
      }
      return new ZodBuilder<T>(keys, config.schema).createProxy();
      
    default:
      throw new Error(`Unsupported builder type: ${config.type}`);
  }
}

function createAsyncBuilderInstance<T>(config: BuilderConfig): AsyncBuilderInstance<T> {
  const keys = config.keys || [];
  
  if (config.type === 'zod' && config.schema) {
    return new AsyncZodBuilder<T>(keys, config.schema).createProxy();
  }
  
  throw new Error('Async builder only supports Zod schemas');
}

export function createBuilder<T>(
  input: ZodSchema | (new (...args: any[]) => T) | string[],
  explicitKeys?: string[]
): BuilderFunction<T> {
  const config = createBuilderConfig(input, explicitKeys);
  
  // Extract keys if not provided
  if (!config.keys) {
    if (config.type === 'zod' && config.schema) {
      config.keys = extractKeysFromZod(config.schema);
    } else if (config.type === 'class' && config.constructor) {
      config.keys = extractKeysFromClass(config.constructor);
    }
  }
  
  const poolKey = getPoolKey(config);
  let pool = builderPools.get(poolKey);
  
  if (!pool) {
    const builderFn = () => createBuilderInstance<T>(config);
    pool = new BuilderPool(builderFn);
    builderPools.set(poolKey, pool);
  }
  
  return () => pool!.get();
}

export function createAsyncBuilder<T>(
  input: ZodSchema,
  explicitKeys?: string[]
): AsyncBuilderFunction<T> {
  const config = createBuilderConfig(input, explicitKeys);
  
  if (config.type !== 'zod') {
    throw new Error('Async builder only supports Zod schemas');
  }
  
  if (!config.schema) {
    throw new Error('Zod schema is required for async builder');
  }
  
  // Extract keys if not provided
  if (!config.keys) {
    config.keys = extractKeysFromZod(config.schema);
  }
  
  const poolKey = `async-${getPoolKey(config)}`;
  let pool = asyncBuilderPools.get(poolKey);
  
  if (!pool) {
    const builderFn = () => createAsyncBuilderInstance<T>(config) as any;
    pool = new BuilderPool(builderFn);
    asyncBuilderPools.set(poolKey, pool);
  }
  
  return () => pool!.get() as unknown as AsyncBuilderInstance<T>;
}

export function clearPools(): void {
  builderPools.forEach(pool => pool.clear());
  asyncBuilderPools.forEach(pool => pool.clear());
  builderPools.clear();
  asyncBuilderPools.clear();
}

export function getPoolStats(): { sync: number; async: number } {
  let syncCount = 0;
  let asyncCount = 0;
  
  builderPools.forEach(pool => syncCount += pool.size());
  asyncBuilderPools.forEach(pool => asyncCount += pool.size());
  
  return { sync: syncCount, async: asyncCount };
}
