/**
 * CustomPicker Example
 *
 * This example demonstrates the customPicker API for efficient data projection.
 * CustomPicker provides multiple ways to select and transform object fields,
 * optimized for different use cases.
 *
 * Key Features:
 * - Path-based projection with dot notation and array support
 * - Zod schema-based projection with validation
 * - Shape-based projection using reference objects
 * - Helper functions for common operations
 * - Pre-cached projectors for repeated operations
 * - Schema caching for improved performance
 */

import { z } from 'zod';
import {
  // CustomPicker Functions
  customPicker,
  pickFields,
  pickFieldsArray,
  omitFields,
  createPicker,

  // Shape-based Projection
  projectByShape,
  createShapeProjector,
  projectArrayByShape,

  // Schema-based Projection
  projectToInterface,

  // Cache Management
  clearGlobalSchemaCache,
  getGlobalSchemaCacheStats,
  resetGlobalSchemaCacheStats
} from '@noony-serverless/type-builder';

// ==============================================================================
// Example 1: Path-based Projection (Most Flexible)
// ==============================================================================

console.log('\n=== Example 1: Path-based Projection ===\n');

// Sample data structure
const user = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    avatar: 'https://example.com/avatar.jpg'
  },
  settings: {
    theme: 'dark',
    notifications: true,
    language: 'en'
  },
  metadata: {
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    lastLogin: '2024-01-20'
  }
};

// Select specific fields using path notation
const basicInfo = customPicker(user, [
  'id',
  'username',
  'email'
]);

console.log('Basic Info:', basicInfo);
// Output: { id: 1, username: 'john_doe', email: 'john@example.com' }

// Access nested fields with dot notation
const userProfile = customPicker(user, [
  'username',
  'profile.firstName',
  'profile.lastName',
  'profile.age',
  'settings.theme'
]);

console.log('User Profile:', userProfile);
// Output: { username: 'john_doe', profile: { firstName: 'John', lastName: 'Doe', age: 30 }, settings: { theme: 'dark' } }

// ==============================================================================
// Example 2: Array Projection
// ==============================================================================

console.log('\n=== Example 2: Array Projection ===\n');

const orders = [
  {
    orderNumber: 'ORD-001',
    customer: {
      name: 'Alice Smith',
      email: 'alice@example.com'
    },
    items: [
      { product: { name: 'Laptop', sku: 'LAP-001' }, quantity: 1, price: 999 },
      { product: { name: 'Mouse', sku: 'MOU-001' }, quantity: 2, price: 25 }
    ],
    total: 1049,
    status: 'shipped'
  },
  {
    orderNumber: 'ORD-002',
    customer: {
      name: 'Bob Johnson',
      email: 'bob@example.com'
    },
    items: [
      { product: { name: 'Keyboard', sku: 'KEY-001' }, quantity: 1, price: 79 }
    ],
    total: 79,
    status: 'pending'
  }
];

// Project arrays with [].fieldName notation
const orderSummaries = orders.map(order =>
  customPicker(order, [
    'orderNumber',
    'customer.name',
    'customer.email',
    'items[].product.name',
    'items[].quantity',
    'items[].price',
    'total',
    'status'
  ])
);

console.log('Order Summaries:', JSON.stringify(orderSummaries, null, 2));

// ==============================================================================
// Example 3: Zod Schema-based Projection
// ==============================================================================

console.log('\n=== Example 3: Zod Schema-based Projection ===\n');

// Define a Zod schema for validation and projection
const UserDTOSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    age: z.number()
  }),
  settings: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  })
});

// Use schema for projection (validates and projects)
const validatedUser = customPicker(user, UserDTOSchema);

console.log('Validated User:', validatedUser);
// This will validate the data and only include fields defined in the schema

// Schema caching provides ~70% performance improvement on repeated projections
const cacheStatsBefore = getGlobalSchemaCacheStats();
console.log('Cache stats before:', cacheStatsBefore);

// Perform multiple projections (second one hits cache)
const projection1 = customPicker(user, UserDTOSchema);
const projection2 = customPicker(user, UserDTOSchema);

const cacheStatsAfter = getGlobalSchemaCacheStats();
console.log('Cache stats after:', cacheStatsAfter);
console.log(`Hit rate: ${(cacheStatsAfter.hitRate * 100).toFixed(1)}%`);

// ==============================================================================
// Example 4: Shape-based Projection (Type-safe)
// ==============================================================================

console.log('\n=== Example 4: Shape-based Projection ===\n');

// Define the shape you want using a reference object
interface UserDTO {
  id: number;
  username: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
  };
  settings: {
    theme: string;
  };
}

// Create a shape reference (can be any object with the same structure)
const userDTOShape: UserDTO = {
  id: 0,
  username: '',
  email: '',
  profile: {
    firstName: '',
    lastName: ''
  },
  settings: {
    theme: ''
  }
};

// Project based on the shape
const shapedUser = projectByShape(user, userDTOShape);

console.log('Shaped User:', shapedUser);
// Output matches the structure of userDTOShape

// Project an array using the same shape
const users = [user, { ...user, id: 2, username: 'jane_doe' }];
const shapedUsers = projectArrayByShape(users, userDTOShape);

console.log('Shaped Users:', shapedUsers);

// ==============================================================================
// Example 5: Helper Functions
// ==============================================================================

console.log('\n=== Example 5: Helper Functions ===\n');

// pickFields: Simple field selection
const picked = pickFields(user, ['id', 'username', 'email']);
console.log('Picked fields:', picked);
// Output: { id: 1, username: 'john_doe', email: 'john@example.com' }

// pickFieldsArray: Pick same fields from multiple objects
const pickedArray = pickFieldsArray(users, ['id', 'username']);
console.log('Picked from array:', pickedArray);
// Output: [{ id: 1, username: 'john_doe' }, { id: 2, username: 'jane_doe' }]

// omitFields: Exclude specific fields
const omitted = omitFields(user, ['metadata', 'settings']);
console.log('Omitted fields:', Object.keys(omitted));
// Output: ['id', 'username', 'email', 'profile']

// ==============================================================================
// Example 6: Pre-cached Projectors (Best Performance)
// ==============================================================================

console.log('\n=== Example 6: Pre-cached Projectors ===\n');

// Create a projector function that caches the schema
const userProjector = createPicker<typeof user>([
  'id',
  'username',
  'email',
  'profile.firstName',
  'profile.lastName'
]);

// Use the projector multiple times (very fast after first call)
const projected1 = userProjector(user);
const projected2 = userProjector({ ...user, id: 2 });
const projected3 = userProjector({ ...user, id: 3 });

console.log('Projected users:', [projected1, projected2, projected3]);

// Create a shape-based projector
const shapeProjector = createShapeProjector(userDTOShape);

const shapedProj1 = shapeProjector(user);
const shapedProj2 = shapeProjector({ ...user, id: 2 });

console.log('Shape projections:', [shapedProj1, shapedProj2]);

// ==============================================================================
// Example 7: Real-world API Use Case
// ==============================================================================

console.log('\n=== Example 7: Real-world API Use Case ===\n');

// Simulate database entities with lots of fields
interface DatabaseUser {
  id: number;
  username: string;
  email: string;
  passwordHash: string; // Never expose this!
  salt: string; // Never expose this!
  profile: {
    firstName: string;
    lastName: string;
    age: number;
    avatar: string;
    bio: string;
  };
  settings: {
    theme: string;
    notifications: boolean;
    language: string;
    timezone: string;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastLogin: string;
    loginCount: number;
  };
  internalNotes: string; // Internal use only
  flags: string[]; // Admin use only
}

const dbUser: DatabaseUser = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  passwordHash: 'hashed_password_here',
  salt: 'salt_here',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Software developer'
  },
  settings: {
    theme: 'dark',
    notifications: true,
    language: 'en',
    timezone: 'UTC'
  },
  metadata: {
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    lastLogin: '2024-01-20',
    loginCount: 42
  },
  internalNotes: 'VIP customer',
  flags: ['verified', 'premium']
};

// Define different API response shapes

// 1. Public profile (minimal info)
const publicProfileProjector = createPicker<DatabaseUser>([
  'id',
  'username',
  'profile.firstName',
  'profile.avatar'
]);

const publicProfile = publicProfileProjector(dbUser);
console.log('Public Profile (for listing):', publicProfile);

// 2. Authenticated user (their own data)
const authenticatedUserProjector = createPicker<DatabaseUser>([
  'id',
  'username',
  'email',
  'profile.firstName',
  'profile.lastName',
  'profile.age',
  'profile.avatar',
  'profile.bio',
  'settings.theme',
  'settings.notifications',
  'settings.language',
  'metadata.createdAt',
  'metadata.lastLogin'
]);

const authenticatedUser = authenticatedUserProjector(dbUser);
console.log('Authenticated User:', authenticatedUser);

// 3. Admin view (everything except sensitive credentials)
const adminProjector = omitFields(dbUser, ['passwordHash', 'salt']);
console.log('Admin View:', Object.keys(adminProjector));

// ==============================================================================
// Example 8: Performance Comparison
// ==============================================================================

console.log('\n=== Example 8: Performance Comparison ===\n');

const iterations = 10000;

// Test 1: Path-based projection (flexible, good performance)
console.time('Path-based projection');
for (let i = 0; i < iterations; i++) {
  customPicker(user, ['id', 'username', 'email', 'profile.firstName']);
}
console.timeEnd('Path-based projection');

// Test 2: Pre-cached projector (best performance for repeated operations)
const cachedProjector = createPicker<typeof user>([
  'id',
  'username',
  'email',
  'profile.firstName'
]);

console.time('Pre-cached projector');
for (let i = 0; i < iterations; i++) {
  cachedProjector(user);
}
console.timeEnd('Pre-cached projector');

// Test 3: Shape-based projection (type-safe, very fast)
const simpleShape = {
  id: 0,
  username: '',
  email: '',
  profile: { firstName: '' }
};

console.time('Shape-based projection');
for (let i = 0; i < iterations; i++) {
  projectByShape(user, simpleShape);
}
console.timeEnd('Shape-based projection');

// ==============================================================================
// Example 9: Cache Management
// ==============================================================================

console.log('\n=== Example 9: Cache Management ===\n');

// Get cache statistics
const stats = getGlobalSchemaCacheStats();
console.log('Current cache stats:', {
  size: stats.size,
  hits: stats.hits,
  misses: stats.misses,
  hitRate: `${(stats.hitRate * 100).toFixed(1)}%`
});

// Reset statistics (useful for testing)
resetGlobalSchemaCacheStats();
console.log('Stats reset:', getGlobalSchemaCacheStats());

// Clear the cache (useful when memory is a concern)
clearGlobalSchemaCache();
console.log('Cache cleared');

// ==============================================================================
// Example 10: Advanced Patterns
// ==============================================================================

console.log('\n=== Example 10: Advanced Patterns ===\n');

// Combine with pipe for transformation pipelines
import { pipe } from '@noony-serverless/type-builder';

// Create a data transformation pipeline
const userTransformPipeline = pipe(
  // 1. Project to public profile
  (user: DatabaseUser) => publicProfileProjector(user),

  // 2. Add computed fields
  (profile: any) => ({
    ...profile,
    displayName: `${profile.profile.firstName}`,
    avatarUrl: profile.profile.avatar
  }),

  // 3. Remove nested profile
  (data: any) => omitFields(data, ['profile'])
);

const transformedUser = userTransformPipeline(dbUser);
console.log('Transformed user:', transformedUser);

// Use with validation and projection
const createUserDTO = (rawData: any) => {
  try {
    // Validate and project in one step
    return customPicker(rawData, UserDTOSchema);
  } catch (error) {
    console.error('Validation failed:', error);
    return null;
  }
};

const validatedDTO = createUserDTO(user);
console.log('Validated DTO:', validatedDTO ? 'Success' : 'Failed');

// ==============================================================================
// Summary of Use Cases
// ==============================================================================

console.log('\n=== Summary ===\n');
console.log(`
CustomPicker Method Comparison:

1. customPicker(data, paths[])
   - Use when: Dynamic field selection, flexible queries
   - Performance: ~50,000-100,000 ops/sec
   - Example: API filtering, GraphQL-like field selection

2. customPicker(data, zodSchema)
   - Use when: Validation required, API boundaries
   - Performance: ~30,000-60,000 ops/sec
   - Example: Request validation, external API responses

3. projectByShape(data, shape)
   - Use when: Type safety needed, DTO creation
   - Performance: ~60,000-120,000 ops/sec
   - Example: Internal DTOs, type-safe projections

4. pickFields/omitFields
   - Use when: Simple field selection/exclusion
   - Performance: ~50,000-100,000 ops/sec
   - Example: Quick filtering, exclude sensitive data

5. createPicker(paths)
   - Use when: Same projection repeated many times
   - Performance: ~80,000-150,000 ops/sec
   - Example: List endpoints, bulk operations, high-throughput APIs

Best Practices:
- Use createPicker() for repeated projections (APIs, loops)
- Use Zod schemas only at API boundaries (validation overhead)
- Use shape-based for internal DTOs (type-safe, fast)
- Use path-based for dynamic/flexible projections
- Monitor cache with getGlobalSchemaCacheStats()
- Clear cache periodically in long-running apps
`);

console.log('\n✅ All examples completed!\n');
