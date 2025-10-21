/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Interface-based Projection Examples
 *
 * This file demonstrates using shape-based projection to select fields
 * from objects without manually specifying path arrays.
 */

import { projectByShape, createShapeProjector, projectArrayByShape } from '../projection';

console.log('\n=== Interface-based Projection Examples ===\n');

// ============================================================================
// Example 1: Basic Shape-based Projection
// ============================================================================

console.log('=== Example 1: Basic Shape-based Projection ===\n');

const fullUser = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  password: '$2a$10$...',
  sessionToken: 'abc123xyz',
  createdAt: '2024-01-01',
  updatedAt: '2024-01-02',
};

// Define the shape we want (public user interface)
const publicUserShape = {
  id: 0,
  username: '',
  email: '',
  createdAt: '',
};

const publicUser = projectByShape(fullUser, publicUserShape);
console.log('Full user:', fullUser);
console.log('Public user (projected):', publicUser);
// Output: { id: 1, username: 'john_doe', email: 'john@example.com', createdAt: '2024-01-01' }

// ============================================================================
// Example 2: Reusable Shape Projector
// ============================================================================

console.log('\n=== Example 2: Reusable Shape Projector ===\n');

// Create a reusable projector function
const toPublicUser = createShapeProjector({
  id: 0,
  username: '',
  email: '',
});

const users = [
  {
    id: 1,
    username: 'john',
    email: 'john@example.com',
    password: 'secret1',
    role: 'admin',
  },
  {
    id: 2,
    username: 'jane',
    email: 'jane@example.com',
    password: 'secret2',
    role: 'user',
  },
];

// Reuse the projector for multiple users
const publicUsers = users.map(toPublicUser);
console.log('Public users:');
console.log(JSON.stringify(publicUsers, null, 2));

// ============================================================================
// Example 3: Database to DTO Transformation
// ============================================================================

console.log('\n=== Example 3: Database to DTO Transformation ===\n');

// Simulated database result
const dbOrder = {
  id: 1,
  order_number: 'ORD-001',
  user_id: 123,
  user_email: 'john@example.com',
  total: 99.99,
  tax: 9.99,
  shipping: 10.0,
  status: 'completed',
  payment_method_id: 'pm_123',
  payment_provider_fee: 2.99,
  internal_notes: 'VIP customer',
  warehouse_location: 'A-12-34',
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T11:00:00Z',
};

// Define the DTO shape
const orderDTOShape = {
  id: 0,
  order_number: '',
  user_email: '',
  total: 0,
  tax: 0,
  shipping: 0,
  status: '',
  created_at: '',
};

const orderDTO = projectByShape(dbOrder, orderDTOShape);
console.log('Order DTO:');
console.log(JSON.stringify(orderDTO, null, 2));

// ============================================================================
// Example 4: Array Projection
// ============================================================================

console.log('\n=== Example 4: Array Projection ===\n');

const dbProducts = [
  {
    id: 1,
    name: 'Laptop',
    description: 'High-performance laptop',
    price: 999.99,
    cost: 500.0,
    supplier_id: 'SUP-001',
    inventory_count: 25,
    warehouse_location: 'A-12-34',
  },
  {
    id: 2,
    name: 'Mouse',
    description: 'Wireless mouse',
    price: 29.99,
    cost: 10.0,
    supplier_id: 'SUP-002',
    inventory_count: 150,
    warehouse_location: 'B-45-67',
  },
];

const productCatalogShape = {
  id: 0,
  name: '',
  description: '',
  price: 0,
};

const catalogProducts = projectArrayByShape(dbProducts, productCatalogShape);
console.log('Catalog products:');
console.log(JSON.stringify(catalogProducts, null, 2));

// ============================================================================
// Example 5: Nested Object Projection
// ============================================================================

console.log('\n=== Example 5: Nested Object Projection ===\n');

const complexData = {
  id: 1,
  title: 'Blog Post',
  author: {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    password: 'secret',
    profile: {
      bio: 'Software developer',
      avatar: 'https://example.com/avatar.jpg',
    },
  },
  content: 'Lorem ipsum...',
  metadata: {
    views: 1000,
    likes: 50,
    internal_score: 0.85,
    processing_time_ms: 125,
  },
};

// Project including nested structures
const blogPostShape = {
  id: 0,
  title: '',
  author: null, // Include entire author object
  content: '',
  metadata: null, // Include entire metadata object
};

const projectedPost = projectByShape(complexData, blogPostShape);
console.log('Projected blog post:');
console.log(JSON.stringify(projectedPost, null, 2));

// ============================================================================
// Example 6: GraphQL-style Field Selection
// ============================================================================

console.log('\n=== Example 6: GraphQL-style Field Selection ===\n');

const productData = {
  id: 1,
  name: 'Laptop',
  description: 'High-performance laptop',
  price: 999.99,
  cost: 500.0,
  supplier: {
    id: 'SUP-001',
    name: 'Tech Supplier Co',
    contact: 'contact@supplier.com',
    internal_rating: 4.5,
  },
  inventory: {
    count: 25,
    warehouse: 'A-12-34',
    reorder_threshold: 10,
  },
  tags: ['electronics', 'computers', 'premium'],
};

// Client requests specific fields (like GraphQL)
function getProductByFields(data: any, requestedFields: string[]) {
  // Build shape from requested fields
  const shape: Record<string, any> = {};
  requestedFields.forEach((field) => {
    shape[field] = null; // null means include the field (any value works)
  });

  return projectByShape(data, shape);
}

const requestedFields = ['id', 'name', 'price', 'tags'];
const response = getProductByFields(productData, requestedFields);
console.log('Requested fields:', requestedFields);
console.log('GraphQL-style response:');
console.log(JSON.stringify(response, null, 2));

// ============================================================================
// Example 7: Creating Type-safe DTOs
// ============================================================================

console.log('\n=== Example 7: Creating Type-safe DTOs ===\n');

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  sessionToken: string;
  createdAt: string;
}

interface UserDTO {
  id: number;
  username: string;
  email: string;
  createdAt: string;
}

const fullUserTyped: User = {
  id: 1,
  username: 'john_doe',
  email: 'john@example.com',
  password: 'secret',
  sessionToken: 'abc123',
  createdAt: '2024-01-01',
};

// Define shape based on UserDTO interface
const userDTOShape: Record<keyof UserDTO, any> = {
  id: 0,
  username: '',
  email: '',
  createdAt: '',
};

const userDTO = projectByShape(fullUserTyped, userDTOShape);
console.log('User DTO:');
console.log(JSON.stringify(userDTO, null, 2));

// ============================================================================
// Example 8: Multi-level Data Sanitization
// ============================================================================

console.log('\n=== Example 8: Multi-level Data Sanitization ===\n');

const sensitiveData = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  ssn: '123-45-6789',
  credit_card: {
    number: '4532-1234-5678-9010',
    cvv: '123',
    expiry: '12/25',
    last_four: '9010',
  },
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    internal_code: 'NYC-001',
  },
};

// Define safe shape for API response
const safeDataShape = {
  id: 0,
  name: '',
  email: '',
  address: null, // Include entire address (will include internal_code too)
};

const safeData = projectByShape(sensitiveData, safeDataShape);
console.log('Safe data:');
console.log(JSON.stringify(safeData, null, 2));

// For more granular control, we can further project nested objects
const addressShape = {
  street: '',
  city: '',
  state: '',
  zip: '',
};

const fullySafeData = {
  ...projectByShape(sensitiveData, { id: 0, name: '', email: '' }),
  address: projectByShape(sensitiveData.address, addressShape),
};

console.log('Fully safe data (nested projection):');
console.log(JSON.stringify(fullySafeData, null, 2));

// ============================================================================
// Example 9: Batch DTO Creation
// ============================================================================

console.log('\n=== Example 9: Batch DTO Creation ===\n');

// Create multiple projectors for different use cases
const toListItem = createShapeProjector({ id: 0, name: '', price: 0 });
const toDetailView = createShapeProjector({ id: 0, name: '', description: '', price: 0, tags: [] });
const toAdminView = createShapeProjector({
  id: 0,
  name: '',
  price: 0,
  cost: 0,
  inventory_count: 0,
});

const product = {
  id: 1,
  name: 'Laptop',
  description: 'High-performance laptop',
  price: 999.99,
  cost: 500.0,
  supplier_id: 'SUP-001',
  inventory_count: 25,
  warehouse_location: 'A-12-34',
  tags: ['electronics', 'computers'],
};

console.log('List item view:', toListItem(product));
console.log('Detail view:', toDetailView(product));
console.log('Admin view:', toAdminView(product));

console.log('\n=== All Interface Projection Examples Complete ===\n');
