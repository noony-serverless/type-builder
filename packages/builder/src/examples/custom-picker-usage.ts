/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * customPicker - Field projection and selection examples
 *
 * This file demonstrates the customPicker feature for selecting/projecting
 * specific fields from objects and arrays, similar to MongoDB's field projection
 * or GraphQL's field selection.
 */

import { z } from 'zod';
import { customPicker, pickFields, createPicker, omitFields } from '../projection';

// ============================================================================
// Example 1: Basic Field Projection
// ============================================================================

console.log('\n=== Example 1: Basic Field Projection ===\n');

const user = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret123',
  internalId: 'USR-XYZ-001',
};

// Project only safe fields for API response
const safeUser = customPicker(user, ['id', 'name', 'email']);
console.log('Original user:', user);
console.log('Safe user (projected):', safeUser);
// Output: { id: 1, name: 'John Doe', email: 'john@example.com' }

// ============================================================================
// Example 2: Nested Field Projection
// ============================================================================

console.log('\n=== Example 2: Nested Field Projection ===\n');

const order = {
  id: 1,
  orderNumber: 'ORD-001',
  user: {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret',
    address: {
      street: '123 Main St',
      city: 'New York',
      zipCode: '10001',
      internalNotes: 'VIP customer',
    },
  },
  items: [
    {
      id: 1,
      productId: 456,
      name: 'Laptop',
      quantity: 1,
      price: 999.99,
      cost: 500, // Internal cost - should not expose
    },
    {
      id: 2,
      productId: 789,
      name: 'Mouse',
      quantity: 2,
      price: 29.99,
      cost: 10,
    },
  ],
  total: 1059.97,
  internalNotes: 'Rush order',
};

// Project only customer-facing fields
const customerOrder = customPicker(order, [
  'id',
  'orderNumber',
  'user.name',
  'user.email',
  'user.address.city',
  'items[].id',
  'items[].name',
  'items[].quantity',
  'items[].price',
  'total',
]);

console.log('Customer order (projected):');
console.log(JSON.stringify(customerOrder, null, 2));

// ============================================================================
// Example 3: Array Projection
// ============================================================================

console.log('\n=== Example 3: Array Projection ===\n');

const users = [
  { id: 1, name: 'John', email: 'john@example.com', password: 'secret1', role: 'admin' },
  { id: 2, name: 'Jane', email: 'jane@example.com', password: 'secret2', role: 'user' },
  { id: 3, name: 'Bob', email: 'bob@example.com', password: 'secret3', role: 'user' },
];

const publicUsers = customPicker(users, ['id', 'name', 'email']);
console.log('Public users (projected):');
console.log(JSON.stringify(publicUsers, null, 2));

// ============================================================================
// Example 4: Schema-based Projection with Validation
// ============================================================================

console.log('\n=== Example 4: Schema-based Projection with Validation ===\n');

const UserResponseSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().optional(),
});

const dbUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret',
  passwordHash: '$2a$10$...',
  salt: 'xyz',
  internalId: 'USR-001',
  createdAt: '2024-01-01',
};

// Use schema for both projection and validation
const validatedUser = customPicker(dbUser, UserResponseSchema);
console.log('Validated user:', validatedUser);

// This would throw ZodError if email was invalid
try {
  const invalidUser = { ...dbUser, email: 'not-an-email' };
  customPicker(invalidUser, UserResponseSchema);
} catch (error: any) {
  console.log('Validation error caught:', error.errors[0]?.message);
}

// ============================================================================
// Example 5: createPicker for Reusable Projections
// ============================================================================

console.log('\n=== Example 5: createPicker for Reusable Projections ===\n');

// Create a reusable picker function
const pickUserFields = createPicker<any, { id: number; name: string; email: string }>([
  'id',
  'name',
  'email',
]);

// Use it multiple times (schema is cached for performance)
const user1 = pickUserFields({ id: 1, name: 'John', email: 'john@example.com', password: 'a' });
const user2 = pickUserFields({ id: 2, name: 'Jane', email: 'jane@example.com', password: 'b' });

console.log('User 1:', user1);
console.log('User 2:', user2);

// Works with arrays too
const userList = [
  { id: 1, name: 'John', email: 'john@example.com', password: 'a' },
  { id: 2, name: 'Jane', email: 'jane@example.com', password: 'b' },
];
const projectedList = pickUserFields(userList);
console.log('Projected list:', projectedList);

// ============================================================================
// Example 6: omitFields Helper
// ============================================================================

console.log('\n=== Example 6: omitFields Helper ===\n');

const fullUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret',
  token: 'abc123',
};

// Omit sensitive fields (inverse of pick)
const safeUserData = omitFields(fullUser, ['password', 'token']);
console.log('Safe user (omitted):', safeUserData);

// ============================================================================
// Example 7: Deep Nested Arrays
// ============================================================================

console.log('\n=== Example 7: Deep Nested Arrays ===\n');

const blogPost = {
  id: 1,
  title: 'My Blog Post',
  author: {
    id: 123,
    name: 'John',
    email: 'john@example.com',
    privateKey: 'secret',
  },
  comments: [
    {
      id: 1,
      text: 'Great post!',
      author: {
        id: 456,
        name: 'Jane',
        email: 'jane@example.com',
        ipAddress: '192.168.1.1',
      },
      replies: [
        {
          id: 1,
          text: 'Thanks!',
          author: { id: 123, name: 'John', sessionToken: 'xyz' },
        },
      ],
    },
  ],
};

const publicBlogPost = customPicker(blogPost, [
  'id',
  'title',
  'author.id',
  'author.name',
  'comments[].id',
  'comments[].text',
  'comments[].author.name',
  'comments[].replies[].id',
  'comments[].replies[].text',
  'comments[].replies[].author.name',
]);

console.log('Public blog post:');
console.log(JSON.stringify(publicBlogPost, null, 2));

// ============================================================================
// Example 8: Real-world API Response Sanitization
// ============================================================================

console.log('\n=== Example 8: Real-world API Response Sanitization ===\n');

// Simulate database query result
const dbResults = [
  {
    user_id: 1,
    user_name: 'John Doe',
    user_email: 'john@example.com',
    user_password_hash: '$2a$10$...',
    order_id: 101,
    order_total: 99.99,
    payment_method: 'credit_card',
    card_last_four: '1234',
    card_cvv: '123', // Should never be stored, but as an example
    internal_processing_fee: 2.5,
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    user_id: 1,
    user_name: 'John Doe',
    user_email: 'john@example.com',
    user_password_hash: '$2a$10$...',
    order_id: 102,
    order_total: 149.99,
    payment_method: 'paypal',
    card_last_four: null,
    card_cvv: null,
    internal_processing_fee: 3.5,
    created_at: '2024-01-02T11:00:00Z',
  },
];

// Create API-safe response projector
const toApiResponse = createPicker([
  'user_id',
  'user_name',
  'user_email',
  'order_id',
  'order_total',
  'payment_method',
  'created_at',
]);

const apiResponse = toApiResponse(dbResults);
console.log('API Response:');
console.log(JSON.stringify(apiResponse, null, 2));

// ============================================================================
// Example 9: pickFields Type-safe Helper
// ============================================================================

console.log('\n=== Example 9: pickFields Type-safe Helper ===\n');

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

const typedUser: User = {
  id: 1,
  name: 'John',
  email: 'john@example.com',
  password: 'secret',
};

const publicUser = pickFields<User, PublicUser>(typedUser, ['id', 'name', 'email']);
console.log('Public user (typed):', publicUser);

console.log('\n=== All Examples Complete ===\n');
