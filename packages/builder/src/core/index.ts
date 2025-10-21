/**
 * Core Builder Module
 * Essential builder pattern implementation
 *
 * @packageDocumentation
 * @module core
 */

// Builder implementations
export { BaseBuilder, createBuilderWithProxy } from './builders/base-builder';
export { InterfaceBuilder } from './builders/interface-builder';
export { ClassBuilder } from './builders/class-builder';
export { ZodBuilder, AsyncZodBuilder } from './builders/zod-builder';

// Factory & detection
export {
  createBuilder,
  createAsyncBuilder,
  clearPools,
  getPoolStats,
  getDetailedPoolStats,
  resetPoolStats,
} from './factory';

export {
  detectBuilderType,
  isZodSchema,
  isClass,
  createBuilderConfig,
  extractKeysFromZod,
  extractKeysFromClass,
} from './detection';

// Core types
export type {
  BuilderType,
  BuilderConfig,
  BuilderInstance,
  AsyncBuilderInstance,
  BuilderFunction,
  AsyncBuilderFunction,
  FluentBuilder,
  FluentAsyncBuilder,
  InferZodType,
} from './types';
