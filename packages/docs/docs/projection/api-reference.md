---
sidebar_position: 3
---

# API Reference

Complete reference for all projection functions, types, and utilities.

## Core Functions

### `customPicker()`

Project specific fields from objects or arrays.

**Signature:**

```typescript
function customPicker<TInput = any, TOutput = any>(
  data: TInput | TInput[],
  selector?: ProjectionSelector,
  options?: PickerOptions
): TOutput | TOutput[];
```

**Parameters:**

- `data` - Input data (object or array of objects)
- `selector` - Projection paths (string[]) or Zod schema
- `options` - Optional picker configuration

**Returns:**

- Projected data with only selected fields

**Example:**

```typescript
const user = { id: 1, name: 'John', password: 'secret' };
const safe = customPicker(user, ['id', 'name']);
// Returns: { id: 1, name: 'John' }
```

---

### `pickFields()`

Type-safe version of `customPicker` with explicit input/output types.

**Signature:**

```typescript
function pickFields<TInput, TOutput>(
  data: TInput,
  selector: ProjectionSelector,
  options?: PickerOptions
): TOutput;
```

**Parameters:**

- `data` - Input data
- `selector` - Projection paths or schema
- `options` - Optional picker configuration

**Returns:**

- Projected data with output type `TOutput`

**Example:**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

interface PublicUser {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  /* ... */
};
const safe = pickFields<User, PublicUser>(user, ['id', 'name', 'email']);
// Type: PublicUser
```

---

### `pickFieldsArray()`

Pick fields from an array with type inference.

**Signature:**

```typescript
function pickFieldsArray<TInput, TOutput>(
  data: TInput[],
  selector: ProjectionSelector,
  options?: PickerOptions
): TOutput[];
```

**Parameters:**

- `data` - Array of input data
- `selector` - Projection paths or schema
- `options` - Optional picker configuration

**Returns:**

- Array of projected data

**Example:**

```typescript
const users = [
  { id: 1, name: 'John', password: 'secret1' },
  { id: 2, name: 'Jane', password: 'secret2' },
];

const safe = pickFieldsArray(users, ['id', 'name']);
// Returns: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
```

---

### `createPicker()`

Create a reusable picker function with pre-cached schema.

**Signature:**

```typescript
function createPicker<TInput = any, TOutput = any>(
  selector: ProjectionSelector,
  options?: PickerOptions
): (data: TInput | TInput[]) => TOutput | TOutput[];
```

**Parameters:**

- `selector` - Projection paths or schema
- `options` - Optional picker configuration

**Returns:**

- Function that applies projection to data

**Example:**

```typescript
const toPublicUser = createPicker<User, PublicUser>(['id', 'name', 'email']);

// Use multiple times (schema cached)
const user1 = toPublicUser(dbUser1);
const user2 = toPublicUser(dbUser2);
const users = toPublicUser([dbUser1, dbUser2]);
```

---

### `omitFields()`

Omit specific fields from an object (inverse of pickFields).

**Signature:**

```typescript
function omitFields<T extends Record<string, any>>(
  data: T,
  fields: (keyof T)[],
  options?: PickerOptions
): Partial<T>;
```

**Parameters:**

- `data` - Input data
- `fields` - Fields to exclude
- `options` - Optional picker configuration

**Returns:**

- Object without omitted fields

**Example:**

```typescript
const user = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
};

const safe = omitFields(user, ['password']);
// Returns: { id: 1, name: 'John', email: 'john@example.com' }
```

---

### `projectToInterface()`

Project data to match a target interface structure.

**Signature:**

```typescript
function projectToInterface<TInput extends Record<string, any>, TOutput>(
  data: TInput,
  options?: PickerOptions
): TOutput;
```

**Parameters:**

- `data` - Input data
- `options` - Optional picker configuration

**Returns:**

- Data projected to target interface

**Note:** This is a type-safe wrapper. The actual projection requires explicit keys or schemas.

**Example:**

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}
interface PublicUser {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  /* ... */
};
const publicUser = projectToInterface<User, PublicUser>(user);
```

---

## Shape-based Functions

### `projectByShape()`

Project data based on a reference object's keys.

**Signature:**

```typescript
function projectByShape<TInput, TShape extends Record<string, any>>(
  data: TInput,
  reference: TShape,
  options?: PickerOptions
): Pick<TInput, Extract<keyof TInput, keyof TShape>>;
```

**Parameters:**

- `data` - Input data to project
- `reference` - Reference object whose keys define the projection
- `options` - Optional picker configuration

**Returns:**

- Projected data with only keys from reference

**Example:**

```typescript
const fullUser = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
};

const publicShape = { id: 0, name: '', email: '' };

const publicUser = projectByShape(fullUser, publicShape);
// Returns: { id: 1, name: 'John', email: 'john@example.com' }
```

---

### `createShapeProjector()`

Create a reusable projector based on a reference shape.

**Signature:**

```typescript
function createShapeProjector<TShape extends Record<string, any>>(
  reference: TShape,
  options?: PickerOptions
): <TInput>(data: TInput) => Pick<TInput, Extract<keyof TInput, keyof TShape>>;
```

**Parameters:**

- `reference` - Reference object whose keys define the projection
- `options` - Optional picker configuration

**Returns:**

- Function that projects data to the reference shape

**Example:**

```typescript
const publicUserShape = { id: 0, name: '', email: '' };
const toPublicUser = createShapeProjector(publicUserShape);

const user1 = toPublicUser({ id: 1, name: 'John', email: 'john@example.com', password: 'a' });
const user2 = toPublicUser({ id: 2, name: 'Jane', email: 'jane@example.com', password: 'b' });
```

---

### `projectArrayByShape()`

Project array of data based on reference shape.

**Signature:**

```typescript
function projectArrayByShape<TInput, TShape extends Record<string, any>>(
  data: TInput[],
  reference: TShape,
  options?: PickerOptions
): Pick<TInput, Extract<keyof TInput, keyof TShape>>[];
```

**Parameters:**

- `data` - Array of input data
- `reference` - Reference object whose keys define projection
- `options` - Optional picker configuration

**Returns:**

- Array of projected data

**Example:**

```typescript
const users = [
  { id: 1, name: 'John', password: 'secret1' },
  { id: 2, name: 'Jane', password: 'secret2' },
];

const publicShape = { id: 0, name: '' };
const publicUsers = projectArrayByShape(users, publicShape);
// Returns: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
```

---

## Schema Building Utilities

### `buildProjectionSchema()`

Build a Zod schema from projection paths.

**Signature:**

```typescript
function buildProjectionSchema(paths: string[]): ZodObject<any>;
```

**Parameters:**

- `paths` - Array of projection paths

**Returns:**

- Zod object schema representing the projection

**Example:**

```typescript
import { buildProjectionSchema } from '@noony-serverless/type-builder';

const schema = buildProjectionSchema(['name', 'email', 'address.city']);
// Returns:
// z.object({
//   name: z.any().optional(),
//   email: z.any().optional(),
//   address: z.object({
//     city: z.any().optional()
//   }).optional()
// })
```

---

### `mergeSchemas()`

Merge multiple Zod object schemas into one.

**Signature:**

```typescript
function mergeSchemas(...schemas: ZodObject<any>[]): ZodObject<any>;
```

**Parameters:**

- `schemas` - Array of Zod object schemas to merge

**Returns:**

- Merged Zod object schema

**Example:**

```typescript
const schema1 = z.object({ id: z.number(), name: z.string() });
const schema2 = z.object({ email: z.string(), age: z.number() });

const merged = mergeSchemas(schema1, schema2);
// Equivalent to z.object({ id, name, email, age })
```

---

### `makeSchemaStrict()`

Convert all optional fields to required.

**Signature:**

```typescript
function makeSchemaStrict(schema: ZodObject<any>): ZodObject<any>;
```

**Parameters:**

- `schema` - Source schema

**Returns:**

- Schema with all fields required

**Example:**

```typescript
const optional = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
});

const strict = makeSchemaStrict(optional);
// Now requires both id and name
```

---

### `makeSchemaPassthrough()`

Allow unknown keys in schema validation.

**Signature:**

```typescript
function makeSchemaPassthrough(schema: ZodObject<any>): ZodObject<any>;
```

**Parameters:**

- `schema` - Source schema

**Returns:**

- Schema with passthrough enabled

**Example:**

```typescript
const schema = z.object({ id: z.number(), name: z.string() });
const passthrough = makeSchemaPassthrough(schema);

passthrough.parse({ id: 1, name: 'John', extra: 'field' });
// ✅ Allows 'extra' field
```

---

## Path Parsing Utilities

### `parsePath()`

Parse a projection path into segments.

**Signature:**

```typescript
function parsePath(path: string): PathSegment[];
```

**Parameters:**

- `path` - Projection path string

**Returns:**

- Array of path segments

**Example:**

```typescript
parsePath('user.address.city');
// Returns:
// [
//   { key: 'user', isArray: false },
//   { key: 'address', isArray: false },
//   { key: 'city', isArray: false }
// ]

parsePath('items[].id');
// Returns:
// [
//   { key: 'items', isArray: true },
//   { key: 'id', isArray: false }
// ]
```

---

### `buildPathTree()`

Build a nested tree structure from paths.

**Signature:**

```typescript
function buildPathTree(paths: string[]): PathTree;
```

**Parameters:**

- `paths` - Array of projection paths

**Returns:**

- Nested tree structure

**Example:**

```typescript
buildPathTree(['user.name', 'user.email', 'items[].id']);
// Returns:
// {
//   user: { name: true, email: true },
//   'items[]': { id: true }
// }
```

---

### `normalizePaths()`

Normalize paths by removing duplicates and sorting.

**Signature:**

```typescript
function normalizePaths(paths: string[]): string[];
```

**Parameters:**

- `paths` - Array of paths

**Returns:**

- Normalized paths (deduplicated and sorted)

**Example:**

```typescript
normalizePaths(['name', 'email', 'name', 'id']);
// Returns: ['email', 'id', 'name']
```

---

### `getCacheKey()`

Generate cache key from paths.

**Signature:**

```typescript
function getCacheKey(paths: string[]): string;
```

**Parameters:**

- `paths` - Array of projection paths

**Returns:**

- Cache key string

**Example:**

```typescript
getCacheKey(['name', 'email', 'id']);
// Returns: 'email|id|name' (normalized and joined)
```

---

### `isArrayPath()`

Check if a path represents an array field.

**Signature:**

```typescript
function isArrayPath(path: string): boolean;
```

**Parameters:**

- `path` - Projection path

**Returns:**

- True if path contains array syntax `[]`

**Example:**

```typescript
isArrayPath('items[]'); // true
isArrayPath('items[].id'); // true
isArrayPath('user.name'); // false
```

---

### `getArrayFieldName()`

Extract base field name from array path.

**Signature:**

```typescript
function getArrayFieldName(path: string): string;
```

**Parameters:**

- `path` - Array path

**Returns:**

- Base field name without `[]`

**Example:**

```typescript
getArrayFieldName('items[]'); // 'items'
getArrayFieldName('items[].id'); // 'items.id'
```

---

## Cache Management

### `getGlobalSchemaCache()`

Get the global schema cache instance.

**Signature:**

```typescript
function getGlobalSchemaCache(): SchemaCache;
```

**Returns:**

- Global schema cache instance

---

### `clearGlobalSchemaCache()`

Clear the global schema cache and reset stats.

**Signature:**

```typescript
function clearGlobalSchemaCache(): void;
```

**Example:**

```typescript
import { clearGlobalSchemaCache } from '@noony-serverless/type-builder';

// Clear cache in tests
beforeEach(() => {
  clearGlobalSchemaCache();
});
```

---

### `getGlobalSchemaCacheStats()`

Get global schema cache statistics.

**Signature:**

```typescript
function getGlobalSchemaCacheStats(): SchemaCacheStats;
```

**Returns:**

- Cache statistics object

**Example:**

```typescript
const stats = getGlobalSchemaCacheStats();
console.log(stats);
// {
//   size: 15,
//   hits: 1234,
//   misses: 20,
//   hitRate: 0.984
// }
```

---

### `resetGlobalSchemaCacheStats()`

Reset global schema cache statistics (keep cache).

**Signature:**

```typescript
function resetGlobalSchemaCacheStats(): void;
```

**Example:**

```typescript
resetGlobalSchemaCacheStats();
const stats = getGlobalSchemaCacheStats();
console.log(stats);
// { size: 15, hits: 0, misses: 0, hitRate: 0 }
```

---

## Types

### `ProjectionPath`

String representing a projection path.

```typescript
type ProjectionPath = string;

// Examples:
const simple: ProjectionPath = 'name';
const nested: ProjectionPath = 'user.address.city';
const array: ProjectionPath = 'items[]';
const arrayField: ProjectionPath = 'items[].id';
const deep: ProjectionPath = 'orders[].items[].product.name';
```

---

### `ProjectionSelector`

Union type for selectors (paths or Zod schema).

```typescript
type ProjectionSelector = ProjectionPath[] | ZodSchema;

// Examples:
const pathSelector: ProjectionSelector = ['id', 'name', 'email'];
const schemaSelector: ProjectionSelector = z.object({
  id: z.number(),
  name: z.string(),
});
```

---

### `PickerOptions`

Configuration options for customPicker behavior.

```typescript
interface PickerOptions {
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
```

**Example:**

```typescript
customPicker(data, ['id', 'name'], {
  strict: true, // Throw if 'name' is missing
  stripUnknown: false, // Keep extra fields
  validate: true, // Validate with Zod
  cache: true, // Use schema cache
});
```

---

### `PathSegment`

Parsed path segment.

```typescript
interface PathSegment {
  key: string;
  isArray: boolean;
}
```

---

### `SchemaCacheStats`

Schema cache statistics.

```typescript
interface SchemaCacheStats {
  size: number; // Number of cached schemas
  hits: number; // Cache hit count
  misses: number; // Cache miss count
  hitRate: number; // Hit rate (hits / total)
}
```

---

### `KeysOf<T>`

Extract keys from type as array.

```typescript
type KeysOf<T> = (keyof T & string)[];

// Example:
interface User {
  id: number;
  name: string;
  email: string;
}

const keys: KeysOf<User> = ['id', 'name', 'email'];
```

---

### `PickKeys<T, K>`

Pick only specified keys from type.

```typescript
type PickKeys<T, K extends keyof T> = Pick<T, K>;

// Example:
type PublicUser = PickKeys<User, 'id' | 'name' | 'email'>;
```

---

### `PathTree`

Nested tree structure for paths.

```typescript
interface PathTree {
  [key: string]: PathTree | boolean;
}

// Example:
const tree: PathTree = {
  user: {
    name: true,
    email: true,
    address: {
      city: true,
    },
  },
  'items[]': {
    id: true,
    name: true,
  },
};
```

---

## SchemaCache Class

### Constructor

```typescript
class SchemaCache {
  constructor(maxSize?: number);
}
```

**Parameters:**

- `maxSize` - Maximum cache size (default: 1000)

---

### Methods

#### `get()`

```typescript
get(cacheKey: string): ZodObject<any> | undefined
```

#### `getByPaths()`

```typescript
getByPaths(paths: string[]): ZodObject<any> | undefined
```

#### `set()`

```typescript
set(cacheKey: string, schema: ZodObject<any>): ZodObject<any>
```

#### `setByPaths()`

```typescript
setByPaths(paths: string[], schema: ZodObject<any>): ZodObject<any>
```

#### `has()`

```typescript
has(cacheKey: string): boolean
```

#### `hasByPaths()`

```typescript
hasByPaths(paths: string[]): boolean
```

#### `getOrCreate()`

```typescript
getOrCreate(cacheKey: string, factory: () => ZodObject<any>): ZodObject<any>
```

#### `clear()`

```typescript
clear(): void
```

#### `size()`

```typescript
size(): number
```

#### `getStats()`

```typescript
getStats(): SchemaCacheStats
```

#### `resetStats()`

```typescript
resetStats(): void
```

---

## Next Steps

- 💡 [Understanding Projection](./understanding) - How it works internally
- 🎯 [Quick Start](./quick-start) - Get started quickly
- 📖 [How-to Guides](./how-to-guides) - Solve specific problems
