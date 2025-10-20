/* eslint-disable @typescript-eslint/no-explicit-any */
import { PathSegment } from './types';

/**
 * Parse a projection path into segments
 *
 * Examples:
 * - "name" -> [{ key: "name", isArray: false }]
 * - "user.address.city" -> [{ key: "user", isArray: false }, { key: "address", isArray: false }, { key: "city", isArray: false }]
 * - "items[]" -> [{ key: "items", isArray: true }]
 * - "items[].id" -> [{ key: "items", isArray: true }, { key: "id", isArray: false }]
 * - "orders[].items[].product.name" -> [{ key: "orders", isArray: true }, { key: "items", isArray: true }, { key: "product", isArray: false }, { key: "name", isArray: false }]
 */
export function parsePath(path: string): PathSegment[] {
  if (!path || path.trim() === '') {
    return [];
  }

  const segments: PathSegment[] = [];
  const parts = path.split('.');

  for (const part of parts) {
    if (part.endsWith('[]')) {
      // Array syntax: "items[]"
      segments.push({
        key: part.slice(0, -2),
        isArray: true,
      });
    } else {
      // Regular property
      segments.push({
        key: part,
        isArray: false,
      });
    }
  }

  return segments;
}

/**
 * Build a nested path structure from parsed segments
 * Used to create a tree of paths for schema building
 *
 * Example:
 * Input: [["user", "name"], ["user", "email"], ["items[]", "id"]]
 * Output: {
 *   user: { name: true, email: true },
 *   "items[]": { id: true }
 * }
 */
export interface PathTree {
  [key: string]: PathTree | boolean;
}

export function buildPathTree(paths: string[]): PathTree {
  const tree: PathTree = {};

  for (const path of paths) {
    const segments = parsePath(path);
    let current = tree;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      const key = segment.isArray ? `${segment.key}[]` : segment.key;
      const isLast = i === segments.length - 1;

      if (isLast) {
        // Leaf node
        current[key] = true;
      } else {
        // Branch node
        if (!current[key] || typeof current[key] === 'boolean') {
          current[key] = {};
        }
        current = current[key] as PathTree;
      }
    }
  }

  return tree;
}

/**
 * Normalize paths by removing duplicates and sorting
 * Used for consistent cache keys
 */
export function normalizePaths(paths: string[]): string[] {
  return [...new Set(paths)].sort();
}

/**
 * Get cache key from paths
 */
export function getCacheKey(paths: string[]): string {
  return normalizePaths(paths).join('|');
}

/**
 * Check if a path represents an array field
 */
export function isArrayPath(path: string): boolean {
  return path.includes('[]');
}

/**
 * Extract the base field name from an array path
 * Example: "items[]" -> "items"
 */
export function getArrayFieldName(path: string): string {
  return path.replace('[]', '');
}
