/* eslint-disable @typescript-eslint/no-explicit-any */
import { ZodSchema } from 'zod';

/**
 * Projection path string supporting:
 * - Simple: "name", "email"
 * - Nested: "user.address.city"
 * - Array: "items[]", "items[].id"
 * - Deep: "orders[].items[].product.name"
 */
export type ProjectionPath = string;

/**
 * Selector can be either:
 * - string[] - Array of projection paths
 * - ZodSchema - Pre-built Zod schema
 * - Interface keys - Type-safe field selection
 */
export type ProjectionSelector = ProjectionPath[] | ZodSchema;

/**
 * Extract keys from type as array
 * Used for interface-based selection
 */
export type KeysOf<T> = (keyof T & string)[];

/**
 * Pick only specified keys from type
 * Useful for type-safe projections
 */
export type PickKeys<T, K extends keyof T> = Pick<T, K>;

/**
 * Options for customPicker behavior
 */
export interface PickerOptions {
  /**
   * Throw error if a projected field is missing
   * @default false
   */
  strict?: boolean;

  /**
   * Remove fields not in projection
   * @default true
   */
  stripUnknown?: boolean;

  /**
   * Run Zod validation on projected data
   * @default true
   */
  validate?: boolean;

  /**
   * Cache built schemas for reuse
   * @default true
   */
  cache?: boolean;
}

/**
 * Parsed path segment
 */
export interface PathSegment {
  key: string;
  isArray: boolean;
}

/**
 * Internal schema cache stats
 */
export interface SchemaCacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}
