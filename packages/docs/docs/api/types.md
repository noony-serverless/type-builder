# Types Reference

Complete TypeScript type definitions for UltraFastBuilder.

## Core Types

### BuilderFunction

Factory function that creates builder instances.

```typescript
type BuilderFunction<T> = () => Builder<T>;
```

**Example:**

```typescript
const createUser: BuilderFunction<User> = builder(UserSchema);
const userBuilder = createUser(); // Returns Builder<User>
```

### AsyncBuilderFunction

Factory function that creates async builder instances.

```typescript
type AsyncBuilderFunction<T> = () => AsyncBuilder<T>;
```

**Example:**

```typescript
const createUser: AsyncBuilderFunction<User> = builderAsync(UserSchema);
const userBuilder = createUser(); // Returns AsyncBuilder<User>
```

### Builder

Builder instance with chainable methods.

```typescript
type Builder<T> = {
  [K in keyof T as `with${Capitalize<string & K>}`]: (value: T[K]) => Builder<T>;
} & {
  build(): T;
};
```

**Example:**

```typescript
interface User {
  name: string;
  email: string;
}

// Builder<User> has:
// - withName(value: string): Builder<User>
// - withEmail(value: string): Builder<User>
// - build(): User
```

### AsyncBuilder

Async builder instance with chainable methods.

```typescript
type AsyncBuilder<T> = {
  [K in keyof T as `with${Capitalize<string & K>}`]: (value: T[K]) => AsyncBuilder<T>;
} & {
  buildAsync(): Promise<T>;
};
```

## Input Types

### ZodSchema

Zod schema type (from Zod library).

```typescript
import { z } from 'zod';

type ZodSchema<T> = z.ZodType<T>;
```

**Example:**

```typescript
const UserSchema: ZodSchema<User> = z.object({
  name: z.string(),
  email: z.string(),
});
```

### Constructor

Class constructor type.

```typescript
type Constructor<T> = new (data: Partial<T>) => T;
```

**Example:**

```typescript
class User {
  name!: string;
  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}

// User is a Constructor<User>
```

## Pool Types

### PoolStats

Statistics about object pool performance.

```typescript
interface PoolStats {
  totalPools: number; // Number of active pools
  totalObjects: number; // Total pooled objects across all pools
  totalHits: number; // Number of times pooled objects were reused
  totalMisses: number; // Number of times new objects were created
  averageHitRate: number; // Hit rate (0-1), higher is better
}
```

**Example:**

```typescript
const stats: PoolStats = getPoolStats();
console.log(`Hit rate: ${(stats.averageHitRate * 100).toFixed(1)}%`);
```

## Utility Types

### BuilderKeys

Extract keys from builder input.

```typescript
type BuilderKeys<T> = ReadonlyArray<keyof T>;
```

**Example:**

```typescript
interface User {
  name: string;
  email: string;
}

const keys: BuilderKeys<User> = ['name', 'email'];
```

### WithMethods

Generate 'with' method names from object keys.

```typescript
type WithMethods<T> = {
  [K in keyof T as `with${Capitalize<string & K>}`]: (value: T[K]) => unknown;
};
```

**Example:**

```typescript
interface User {
  name: string;
  email: string;
}

type UserWithMethods = WithMethods<User>;
// {
//   withName(value: string): unknown;
//   withEmail(value: string): unknown;
// }
```

## Advanced Types

### Partial Builder

Builder that accepts partial data.

```typescript
type PartialBuilder<T> = {
  [K in keyof T as `with${Capitalize<string & K>}`]?: (value: T[K]) => PartialBuilder<T>;
} & {
  build(): Partial<T>;
};
```

This represents the internal state where not all fields are set.

### BuilderMode

Type of builder being used.

```typescript
type BuilderMode = 'zod' | 'class' | 'interface';
```

**Example:**

```typescript
function detectMode<T>(input: any): BuilderMode {
  if (isZodSchema(input)) return 'zod';
  if (isClass(input)) return 'class';
  return 'interface';
}
```

## Type Guards

### isZodSchema

Check if input is a Zod schema.

```typescript
function isZodSchema<T>(input: any): input is ZodSchema<T> {
  return (
    input &&
    typeof input === 'object' &&
    typeof input.parse === 'function' &&
    typeof input.safeParse === 'function' &&
    input._def !== undefined
  );
}
```

**Example:**

```typescript
const UserSchema = z.object({ name: z.string() });

if (isZodSchema(UserSchema)) {
  console.log('This is a Zod schema');
}
```

### isClass

Check if input is a class constructor.

```typescript
function isClass<T>(input: any): input is Constructor<T> {
  return typeof input === 'function' && input.prototype && input.prototype.constructor === input;
}
```

**Example:**

```typescript
class User {}

if (isClass(User)) {
  console.log('This is a class');
}
```

## Generic Constraints

### Examples with Constraints

```typescript
// Ensure T is an object type
function builder<T extends Record<string, any>>(
  input: ZodSchema<T> | Constructor<T> | ReadonlyArray<keyof T>
): BuilderFunction<T>;

// Ensure T has specific properties
function builder<T extends { id: string }>(input: Constructor<T>): BuilderFunction<T>;
```

## Type Inference Examples

### Infer from Zod

```typescript
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

type User = z.infer<typeof UserSchema>;
// { name: string; age: number; }

const createUser = builder(UserSchema);
// createUser: BuilderFunction<{ name: string; age: number; }>
```

### Infer from Class

```typescript
class Product {
  id!: number;
  name!: string;
}

const createProduct = builder(Product);
// createProduct: BuilderFunction<Product>
```

### Infer from Interface

```typescript
interface Order {
  id: string;
  total: number;
}

const createOrder = builder<Order>(['id', 'total']);
// createOrder: BuilderFunction<Order>
```

## Conditional Types

### BuilderReturnType

Get the return type based on builder mode.

```typescript
type BuilderReturnType<T, TInput> =
  TInput extends ZodSchema<T>
    ? T
    : TInput extends Constructor<T>
      ? T
      : TInput extends ReadonlyArray<any>
        ? T
        : never;
```

## Type Utilities

### Extract Builder Methods

```typescript
type BuilderMethods<T> = {
  [K in keyof T as `with${Capitalize<string & K>}`]: (value: T[K]) => Builder<T>;
};

interface User {
  name: string;
  email: string;
}

type UserBuilderMethods = BuilderMethods<User>;
// {
//   withName(value: string): Builder<User>;
//   withEmail(value: string): Builder<User>;
// }
```

### Extract Property Types

```typescript
type PropertyTypes<T> = {
  [K in keyof T]: T[K];
};

interface User {
  name: string;
  age: number;
}

type UserProps = PropertyTypes<User>;
// { name: string; age: number; }
```

## Next Steps

- [Core Functions](./core-functions.md) - Function signatures
- [Utilities](./utilities.md) - Utility functions
- [Basic Usage](../getting-started/basic-usage.md) - Learn the basics
