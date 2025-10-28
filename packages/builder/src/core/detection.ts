/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodSchema } from 'zod';
import { BuilderConfig, BuilderType } from './types';

export function detectBuilderType(input: any): BuilderType {
  if (isZodSchema(input)) {
    return 'zod';
  }

  if (isClass(input)) {
    return 'class';
  }

  if (Array.isArray(input)) {
    return 'interface';
  }

  throw new Error(
    'Unable to detect builder type. Expected Zod schema, class constructor, or array of keys.'
  );
}

export function isZodSchema(input: any): input is ZodSchema {
  return (
    input &&
    typeof input === 'object' &&
    typeof input.parse === 'function' &&
    typeof input.safeParse === 'function' &&
    (input._def !== undefined || input._zod?.def !== undefined)
  );
}

export function isClass(input: any): input is new (...args: any[]) => any {
  return typeof input === 'function' && input.prototype && input.prototype.constructor === input;
}

export function createBuilderConfig<T>(
  input: ZodSchema | (new (...args: any[]) => T) | string[],
  explicitKeys?: string[]
): BuilderConfig {
  const type = detectBuilderType(input);

  switch (type) {
    case 'zod':
      return {
        type: 'zod',
        schema: input as ZodSchema,
      } as BuilderConfig;

    case 'class':
      return {
        type: 'class',
        constructor: input as new (...args: any[]) => T,
      } as BuilderConfig;

    case 'interface': {
      const keys = Array.isArray(input) ? input : explicitKeys || [];
      if (keys.length === 0) {
        throw new Error('Interface mode requires an array of property keys');
      }
      return {
        type: 'interface',
        keys,
      } as BuilderConfig;
    }

    default:
      throw new Error(`Unsupported builder type: ${type}`);
  }
}

export function extractKeysFromZod(schema: ZodSchema): string[] {
  const keys: string[] = [];
  const schemaAny = schema as any;

  // Try accessing .shape directly (Zod v4 object schemas have this as a property)
  // Validate that it's a valid Zod shape by checking if values have parse/safeParse methods
  if (schemaAny.shape && typeof schemaAny.shape === 'object') {
    const shape = schemaAny.shape;
    // Validate it's a Zod shape by checking first value
    const firstKey = Object.keys(shape)[0];
    if (firstKey && shape[firstKey] && typeof shape[firstKey].parse === 'function') {
      for (const key in shape) {
        keys.push(key);
      }
      return keys;
    }
  }

  // Fallback: Try _def.shape() for Zod v3 compatibility
  const def = schemaAny._zod?.def || schemaAny._def;
  if (def && 'shape' in def) {
    if (typeof def.shape === 'function') {
      const shape = def.shape();
      for (const key in shape) {
        keys.push(key);
      }
    }
  }

  return keys;
}

export function extractKeysFromClass<T>(constructor: new (...args: any[]) => T): string[] {
  const keys: string[] = [];

  // Strategy 1: Try creating instance with a Proxy that captures property assignments
  const capturedKeys = new Set<string>();
  const proxyHandler = {
    set(target: any, prop: string | symbol, value: any) {
      if (typeof prop === 'string' && prop !== 'constructor') {
        capturedKeys.add(prop);
      }
      target[prop] = value;
      return true;
    },
  };

  try {
    const target = {};
    const proxy = new Proxy(target, proxyHandler);
    // Try to construct with empty object
    constructor.call(proxy, {});
    capturedKeys.forEach((key) => keys.push(key));
  } catch {
    // Proxy approach failed
  }

  // Strategy 2: If proxy didn't work, try with empty object
  if (keys.length === 0) {
    try {
      const instance = new constructor({});
      for (const key in instance) {
        if (Object.prototype.hasOwnProperty.call(instance, key)) {
          keys.push(key);
        }
      }
    } catch {
      // Strategy 3: Try without arguments
      try {
        const instance = new constructor();
        for (const key in instance) {
          if (Object.prototype.hasOwnProperty.call(instance, key)) {
            keys.push(key);
          }
        }
      } catch {
        // All strategies failed
      }
    }
  }

  return keys;
}
