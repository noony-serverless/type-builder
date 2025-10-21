/**
 * TypeScript Type Inference Examples
 *
 * This file demonstrates how the builder library provides full IDE autocomplete
 * and type safety for all .withXYZ() methods automatically generated from your
 * schemas, classes, and interfaces.
 *
 * ALL TYPES ARE COMPILE-TIME ONLY - Zero runtime cost!
 */

import builder, { builderAsync } from '../index';
import { z } from 'zod';

console.log('='.repeat(80));
console.log('TypeScript Type Inference Examples');
console.log('='.repeat(80));

// ============================================================================
// Example 1: Zod Schema - Full Type Inference
// ============================================================================

console.log('\n1️⃣  Zod Schema Type Inference\n');

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean(),
});

const createUser = builder(UserSchema);

// ✅ IDE autocompletes: .withId(), .withName(), .withEmail(), .withAge(), .withIsActive()
// ✅ TypeScript knows the exact type of each parameter
const user = createUser()
  .withId(1) // ✅ Expects number
  .withName('John Doe') // ✅ Expects string
  .withEmail('john@example.com') // ✅ Expects string (email validated at runtime)
  .withAge(30) // ✅ Expects number
  .withIsActive(true) // ✅ Expects boolean
  .build();

console.log('User:', user);
// Type: { id: number, name: string, email: string, age: number, isActive: boolean }

// ❌ TypeScript Errors (uncomment to see):
// createUser().withId('not-a-number'); // Error: Argument of type 'string' is not assignable to parameter of type 'number'
// createUser().withFoo('bar');         // Error: Property 'withFoo' does not exist
// createUser().withName(123);          // Error: Argument of type 'number' is not assignable to parameter of type 'string'

// ============================================================================
// Example 2: Class - Infer from Class Properties
// ============================================================================

console.log('\n2️⃣  Class Type Inference\n');

class Product {
  id!: number;
  name!: string;
  price!: number;
  category!: string;
  inStock!: boolean;

  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }

  // Business methods preserved!
  getTax(rate: number): number {
    return this.price * rate;
  }

  getDiscountedPrice(percent: number): number {
    return this.price * (1 - percent / 100);
  }

  isExpensive(): boolean {
    return this.price > 1000;
  }
}

const createProduct = builder(Product);

// ✅ IDE autocompletes: .withId(), .withName(), .withPrice(), .withCategory(), .withInStock()
const product = createProduct()
  .withId(1)
  .withName('MacBook Pro')
  .withPrice(2499)
  .withCategory('Electronics')
  .withInStock(true)
  .build();

console.log('Product:', product);
console.log('Tax (8%):', product.getTax(0.08));
console.log('Discounted (10%):', product.getDiscountedPrice(10));
console.log('Is expensive?', product.isExpensive());

// Type: Product (with all methods available)

// ============================================================================
// Example 3: Interface - Explicit Type with Autocomplete
// ============================================================================

console.log('\n3️⃣  Interface Type Inference\n');

interface Order {
  id: string;
  customerId: string;
  SKU: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  items: OrderItem[];
  createdAt: Date;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

// Only this declaration is needed:
const createOrder = builder<Order>([
  'id',
  'customerId',
  'SKU',
  'total',
  'status',
  'items',
  'createdAt',
]);

// ✅ IDE autocompletes all methods
const order = createOrder()
  .withId('ORD-001')
  .withSKU('SKU-001')
  .withCustomerId('CUST-123')
  .withTotal(299.99)
  .withStatus('pending') // ✅ TypeScript knows: 'pending' | 'completed' | 'cancelled'
  .withItems([
    { productId: 'PROD-1', quantity: 2, price: 99.99 },
    { productId: 'PROD-2', quantity: 1, price: 100.01 },
  ])
  .withCreatedAt(new Date())
  .build();

console.log('Order:', order);
// Type: { id: string, customerId: string, SKU: string, total: number, status: 'pending' | 'completed' | 'cancelled', items: OrderItem[], createdAt: Date }

// ❌ TypeScript Error (uncomment to see):
// createOrder().withStatus('invalid'); // Error: Argument of type '"invalid"' is not assignable to parameter of type '"pending" | "completed" | "cancelled"'

// ============================================================================
// Example 4: Async Builder with Type Inference
// ============================================================================

console.log('\n4️⃣  Async Builder Type Inference\n');

const createUserAsync = builderAsync(UserSchema);

async function createAsyncUser() {
  // ✅ IDE autocompletes all methods + buildAsync()
  const user = createUserAsync()
    .withId(2)
    .withName('Jane Doe')
    .withEmail('jane@example.com')
    .withAge(25)
    .withIsActive(true)
    .build(); // ✅ Returns Promise<{ id: number, name: string, email: string, age: number, isActive: boolean }>

  console.log('Async User:', user);
  return user;
}

createAsyncUser().catch(console.error);

// ============================================================================
// Example 5: Complex Nested Types
// ============================================================================

console.log('\n5️⃣  Complex Nested Types\n');

const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  content: z.string(),
  author: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
  tags: z.array(z.string()),
  metadata: z.record(z.string()),
  publishedAt: z.date(),
  views: z.number().int().min(0),
});

const createBlogPost = builder(BlogPostSchema);

// ✅ All nested types preserved
const post = createBlogPost()
  .withId('POST-001')
  .withTitle('TypeScript Builder Pattern')
  .withContent('This is a comprehensive guide...')
  .withAuthor({
    id: 'AUTH-1',
    name: 'John Developer',
    email: 'john@dev.com',
  })
  .withTags(['typescript', 'builder', 'design-patterns'])
  .withMetadata({ category: 'tutorial', difficulty: 'intermediate' })
  .withPublishedAt(new Date())
  .withViews(1250)
  .build();

console.log('Blog Post:', post.title);
console.log('Author:', post.author.name);
console.log('Tags:', post.tags.join(', '));

// ============================================================================
// Example 6: Optional Properties
// ============================================================================

console.log('\n6️⃣  Optional Properties\n');

const ProfileSchema = z.object({
  userId: z.string(),
  bio: z.string().optional(),
  website: z.string().url().optional(),
  avatar: z.string().url().optional(),
});

const createProfile = builder(ProfileSchema);

// ✅ Optional properties can be omitted
const profile1 = createProfile().withUserId('USER-123').build(); // ✅ Valid - optional fields not required

const profile2 = createProfile()
  .withUserId('USER-456')
  .withBio('Software engineer passionate about TypeScript')
  .withWebsite('https://example.com')
  .withAvatar('https://example.com/avatar.jpg')
  .build();

console.log('Profile 1:', profile1);
console.log('Profile 2:', profile2);

// ============================================================================
// Example 7: Union Types
// ============================================================================

console.log('\n7️⃣  Union Types\n');

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'crypto';
  isDefault: boolean;
}

const createPaymentMethod = builder<PaymentMethod>(['id', 'type', 'isDefault']);

// ✅ TypeScript ensures only valid union values
const payment = createPaymentMethod()
  .withId('PM-001')
  .withType('credit_card') // ✅ Must be one of: 'credit_card' | 'debit_card' | 'paypal' | 'crypto'
  .withIsDefault(true)
  .build();

console.log('Payment Method:', payment);

// ❌ TypeScript Error (uncomment to see):
// createPaymentMethod().withType('bitcoin'); // Error: Argument of type '"bitcoin"' is not assignable to parameter of type '"credit_card" | "debit_card" | "paypal" | "crypto"'

// ============================================================================
// Example 8: Method Chaining with Multiple Builders
// ============================================================================

console.log('\n8️⃣  Multiple Builders with Type Safety\n');

const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
});

const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
});

const createAddress = builder(AddressSchema);
const createCustomer = builder(CustomerSchema);

// Each builder has its own type-safe methods
const address = createAddress()
  .withStreet('123 Main St')
  .withCity('San Francisco')
  .withState('CA')
  .withZipCode('94102')
  .withCountry('USA')
  .build();

const customer = createCustomer()
  .withId('CUST-789')
  .withName('Alice Smith')
  .withEmail('alice@example.com')
  .withPhone('+1-555-0123')
  .build();

console.log('Address:', address);
console.log('Customer:', customer);

// ============================================================================
// Example 9: Date and Complex Types
// ============================================================================

console.log('\n9️⃣  Date and Complex Types\n');

interface Event {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  attendees: string[];
  metadata: Record<string, string | number | boolean>;
}

const createEvent = builder<Event>(['id', 'name', 'startDate', 'endDate', 'attendees', 'metadata']);

const event = createEvent()
  .withId('EVT-001')
  .withName('TypeScript Conference 2024')
  .withStartDate(new Date('2024-06-01'))
  .withEndDate(new Date('2024-06-03'))
  .withAttendees(['user1', 'user2', 'user3'])
  .withMetadata({
    location: 'San Francisco',
    capacity: 500,
    virtual: false,
  })
  .build();

console.log('Event:', event.name);
console.log('Duration:', event.startDate.toDateString(), '-', event.endDate.toDateString());

// ============================================================================
// Example 10: Type Inference with Generics
// ============================================================================

console.log('\n🔟 Generic Type Inference\n');

// Generic response wrapper
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

const createApiResponse = builder<ApiResponse<{ userId: string; username: string }>>([
  'data',
  'status',
  'message',
]);

const response = createApiResponse()
  .withData({ userId: 'U123', username: 'johndoe' })
  .withStatus(200)
  .withMessage('Success')
  .build();

console.log('API Response:', response);

console.log('\n' + '='.repeat(80));
console.log('✅ All examples demonstrate full type inference and IDE autocomplete!');
console.log('='.repeat(80));
