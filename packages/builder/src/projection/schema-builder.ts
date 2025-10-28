/* eslint-disable @typescript-eslint/no-explicit-any */
import { z, ZodObject, ZodTypeAny } from 'zod';
import { buildPathTree, PathTree } from './path-parser';

/**
 * Build a Zod schema from projection paths
 *
 * Converts dotted path notation into nested Zod object schemas.
 * Leaf fields are z.any().optional() by default.
 * Array fields (ending with []) are z.array(z.any()).optional()
 *
 * @param paths - Array of projection paths
 * @returns Zod object schema representing the projection
 *
 * @example
 * ```typescript
 * const schema = buildProjectionSchema(['name', 'email', 'address.city']);
 * // Returns:
 * // z.object({
 * //   name: z.any().optional(),
 * //   email: z.any().optional(),
 * //   address: z.object({
 * //     city: z.any().optional()
 * //   }).optional()
 * // })
 * ```
 */
export function buildProjectionSchema(paths: string[]): ZodObject<any> {
  if (!paths || paths.length === 0) {
    return z.object({});
  }

  const tree = buildPathTree(paths);
  const shape = buildSchemaFromTree(tree);

  return z.object(shape);
}

/**
 * Recursively build Zod schema shape from path tree
 */
function buildSchemaFromTree(tree: PathTree): Record<string, ZodTypeAny> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'boolean') {
      // Leaf node
      if (key.endsWith('[]')) {
        // Array field: "items[]" -> z.array(z.any()).optional()
        const fieldName = key.slice(0, -2);
        shape[fieldName] = z.array(z.any()).optional();
      } else {
        // Regular field: "name" -> z.any().optional()
        shape[key] = z.any().optional();
      }
    } else {
      // Branch node - recursively build nested schema
      if (key.endsWith('[]')) {
        // Array of objects: "items[].id" -> z.array(z.object({ id: z.any() })).optional()
        const fieldName = key.slice(0, -2);
        const nestedShape = buildSchemaFromTree(value as PathTree);
        shape[fieldName] = z.array(z.object(nestedShape)).optional();
      } else {
        // Nested object: "address.city" -> z.object({ city: z.any() }).optional()
        const nestedShape = buildSchemaFromTree(value as PathTree);
        shape[key] = z.object(nestedShape).optional();
      }
    }
  }

  return shape;
}

/**
 * Merge multiple Zod object schemas into one
 * Useful for combining projections
 *
 * @param schemas - Array of Zod object schemas to merge
 * @returns Merged Zod object schema
 */
export function mergeSchemas(...schemas: ZodObject<any>[]): ZodObject<any> {
  if (schemas.length === 0) {
    return z.object({});
  }

  if (schemas.length === 1) {
    return schemas[0]!;
  }

  let merged = schemas[0]!;
  for (let i = 1; i < schemas.length; i++) {
    merged = merged.merge(schemas[i]!);
  }

  return merged;
}

/**
 * Create a strict schema (non-optional fields)
 * Converts all .optional() fields to required
 *
 * @param schema - Source schema
 * @returns Schema with all fields required
 */
export function makeSchemaStrict(schema: ZodObject<any>): ZodObject<any> {
  const shape: Record<string, ZodTypeAny> = {};
  const entries = Object.entries(schema.shape);

  for (const [key, value] of entries) {
    const zodType = value as ZodTypeAny;

    // Remove optional wrapper if present using unwrap
    // In Zod v4, we check if it's an optional type and unwrap it
    if (zodType instanceof z.ZodOptional) {
      shape[key] = zodType.unwrap() as ZodTypeAny;
    } else {
      shape[key] = zodType;
    }
  }

  return z.object(shape);
}

/**
 * Create a passthrough schema (allows unknown keys)
 * Useful when you want projection but don't want to strip other fields
 *
 * @param schema - Source schema
 * @returns Schema with passthrough enabled
 */
export function makeSchemaPassthrough(schema: ZodObject<any>): ZodObject<any> {
  return schema.passthrough();
}
