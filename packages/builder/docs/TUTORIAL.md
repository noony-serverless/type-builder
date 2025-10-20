# Getting Started with @noony-serverless/type-builder

**A hands-on tutorial to learn the builder pattern library from scratch**

---

## What You'll Learn

By the end of this tutorial, you will:
- ✅ Build your first fluent builder with Zod
- ✅ Create class-based builders with methods
- ✅ Use interface builders for maximum performance
- ✅ Handle validation errors gracefully
- ✅ Build async validators for high-concurrency apps

**Time:** ~20 minutes
**Prerequisites:** Basic TypeScript knowledge, Node.js 18+

---

## Step 1: Installation

Let's start by creating a new project and installing the library.

### Create a New Project

```bash
mkdir builder-tutorial
cd builder-tutorial
npm init -y
npm install typescript ts-node @types/node --save-dev
npx tsc --init
```

### Install the Library

```bash
npm install @noony-serverless/type-builder zod
```

**Why Zod?** It's a TypeScript-first validation library that works perfectly with our builder. You'll see why in a moment.

---

## Step 2: Your First Builder (Zod Mode)

Let's build a user registration system. Create `src/tutorial.ts`:

```typescript
import builder from '@noony-serverless/type-builder';
import { z } from 'zod';

// Step 2.1: Define your schema
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().min(18).optional()
});

// Step 2.2: Create the builder
const createUser = builder(UserSchema);

// Step 2.3: Build your first user
const user = createUser()
  .withEmail('alice@example.com')
  .withName('Alice')
  .withAge(25)
  .build();

console.log('User created:', user);
```

### Run It

```bash
npx ts-node src/tutorial.ts
```

**Output:**
```
User created: { email: 'alice@example.com', name: 'Alice', age: 25 }
```

### What Just Happened?

1. **`builder(UserSchema)`** - The library detected it's a Zod schema
2. **Auto-generated methods** - `.withEmail()`, `.withName()`, `.withAge()`
3. **Type-safe** - Your IDE autocompletes all methods
4. **Validated** - `.build()` runs Zod validation automatically

### Try the Autocomplete

Type `createUser().with` and watch your IDE suggest:
- ✅ `withEmail`
- ✅ `withName`
- ✅ `withAge`

**This is the magic.** No manual builder class. Just pass the schema.

---

## Step 3: Validation in Action

Let's see what happens when data is invalid.

```typescript
// Add this to src/tutorial.ts

try {
  const invalidUser = createUser()
    .withEmail('not-an-email')  // ❌ Invalid email
    .withName('A')              // ❌ Too short (min 2)
    .build();
} catch (error) {
  console.error('Validation failed:', error);
}
```

**Output:**
```
Validation failed: ZodError: [
  {
    "code": "invalid_string",
    "validation": "email",
    "path": ["email"],
    "message": "Invalid email"
  },
  {
    "code": "too_small",
    "minimum": 2,
    "path": ["name"],
    "message": "String must contain at least 2 character(s)"
  }
]
```

### Why This Matters

You just validated user input with **zero boilerplate**. No manual `if` checks, no custom validators. Zod does it all.

---

## Step 4: Class Builders (Adding Behavior)

Zod is great for validation, but what if you need **methods**? Let's use a class.

```typescript
// Step 4.1: Define a class with methods
class Product {
  id!: number;
  name!: string;
  price!: number;
  taxRate: number = 0.1;

  // Business logic
  getPriceWithTax(): number {
    return this.price * (1 + this.taxRate);
  }

  applyDiscount(percent: number): void {
    this.price *= (1 - percent / 100);
  }
}

// Step 4.2: Create the builder
const createProduct = builder(Product);

// Step 4.3: Build and use methods
const product = createProduct()
  .withId(1)
  .withName('Laptop')
  .withPrice(1000)
  .build();

console.log('Price:', product.price);
console.log('With tax:', product.getPriceWithTax());

product.applyDiscount(10);
console.log('After discount:', product.price);
```

**Output:**
```
Price: 1000
With tax: 1100
After discount: 900
```

### What Changed?

1. **`builder(Product)`** - Detected it's a class
2. **Methods preserved** - `getPriceWithTax()` and `applyDiscount()` work
3. **Real class instance** - `product instanceof Product === true`

### When to Use Classes

Use class builders when you need:
- ✅ Business logic (methods)
- ✅ Encapsulation
- ✅ OOP patterns (inheritance, interfaces)

---

## Step 5: Interface Builders (Maximum Speed)

For pure data transformation (no validation, no methods), use interfaces.

```typescript
// Step 5.1: Define an interface
interface OrderDTO {
  id: string;
  total: number;
  status: 'pending' | 'completed';
}

// Step 5.2: Create the builder (note the array!)
const createOrderDTO = builder<OrderDTO>(['id', 'total', 'status']);

// Step 5.3: Build at lightning speed
const order = createOrderDTO()
  .withId('ORD-123')
  .withTotal(1500)
  .withStatus('pending')
  .build();

console.log('Order:', order);
```

**Output:**
```
Order: { id: 'ORD-123', total: 1500, status: 'pending' }
```

### Why the Array?

Interfaces **don't exist at runtime** (TypeScript erases them). So you must tell the library which properties exist:

```typescript
// ❌ Won't work - no runtime info
const create = builder<OrderDTO>();

// ✅ Works - you provide the keys
const create = builder<OrderDTO>(['id', 'total', 'status']);
```

### When to Use Interfaces

Use interface builders when:
- ✅ Maximum speed is critical (~2x faster than classes)
- ✅ You're transforming already-validated data
- ✅ You don't need methods

---

## Step 6: The Three Modes Together

Here's a real-world example using all three modes:

```typescript
// API Endpoint Example
import express from 'express';

const app = express();

// 1️⃣ Input validation (Zod)
const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number().min(1)
  })),
  total: z.number().positive()
});

const validateOrder = builder(CreateOrderSchema);

// 2️⃣ Domain model (Class)
class Order {
  id!: string;
  customerId!: string;
  items!: Array<{ productId: number; quantity: number }>;
  total!: number;
  status: string = 'pending';
  createdAt: Date = new Date();

  markAsCompleted(): void {
    this.status = 'completed';
  }

  calculateTax(): number {
    return this.total * 0.1;
  }
}

const createOrder = builder(Order);

// 3️⃣ Response DTO (Interface)
interface OrderResponseDTO {
  id: string;
  status: string;
  total: number;
}

const createResponseDTO = builder<OrderResponseDTO>(['id', 'status', 'total']);

// API Endpoint
app.post('/api/orders', async (req, res) => {
  try {
    // Step 1: Validate input (Zod)
    const input = validateOrder()
      .withCustomerId(req.body.customerId)
      .withItems(req.body.items)
      .withTotal(req.body.total)
      .build(); // ✅ Throws if invalid

    // Step 2: Create domain object (Class)
    const order = createOrder()
      .withId(`ORD-${Date.now()}`)
      .withCustomerId(input.customerId)
      .withItems(input.items)
      .withTotal(input.total)
      .build();

    // Business logic
    const tax = order.calculateTax();
    console.log('Tax:', tax);

    // Save to database
    // await db.orders.create(order);

    // Step 3: Return DTO (Interface - fast!)
    const response = createResponseDTO()
      .withId(order.id)
      .withStatus(order.status)
      .withTotal(order.total)
      .build();

    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### The Flow

```
1. External Input → Zod Builder (validate)
           ↓
2. Domain Logic → Class Builder (business logic)
           ↓
3. API Response → Interface Builder (speed)
```

---

## Step 7: Async Builders

For high-concurrency apps, use async builders to avoid blocking the event loop.

```typescript
import { builderAsync } from '@noony-serverless/type-builder';

// Step 7.1: Create async builder
const validateUserAsync = builderAsync(UserSchema);

// Step 7.2: Use with await
async function registerUser(data: any) {
  const user = await validateUserAsync()
    .withEmail(data.email)
    .withName(data.name)
    .withAge(data.age)
    .buildAsync(); // ⚡ Non-blocking validation

  console.log('User registered:', user);
  return user;
}

// Step 7.3: Test it
registerUser({
  email: 'bob@example.com',
  name: 'Bob',
  age: 30
}).then(() => console.log('Done!'));
```

### Sync vs Async

| Mode | When to Use | Performance |
|------|-------------|-------------|
| **Sync** (`builder`) | Low concurrency, simple apps | Faster (~100k ops/sec) |
| **Async** (`builderAsync`) | High concurrency (1000+ req/sec) | Slightly slower, non-blocking |

**Rule of thumb:** Use async in production APIs with high traffic.

---

## Step 8: Error Handling

Let's make our validation errors user-friendly.

```typescript
import { ZodError } from 'zod';

function createUserSafely(data: any) {
  try {
    const user = createUser()
      .withEmail(data.email)
      .withName(data.name)
      .withAge(data.age)
      .build();

    return { success: true, data: user };
  } catch (error) {
    if (error instanceof ZodError) {
      // Format Zod errors nicely
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));

      return { success: false, errors };
    }

    throw error; // Re-throw unexpected errors
  }
}

// Test it
const result = createUserSafely({
  email: 'invalid-email',
  name: 'A',
  age: 15
});

console.log(result);
```

**Output:**
```json
{
  "success": false,
  "errors": [
    { "field": "email", "message": "Invalid email" },
    { "field": "name", "message": "String must contain at least 2 character(s)" },
    { "field": "age", "message": "Number must be greater than or equal to 18" }
  ]
}
```

---

## Step 9: Optional Fields

Not all fields are required. Here's how to handle optional properties.

```typescript
const UserProfileSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  bio: z.string().optional(),           // ← Optional
  website: z.string().url().optional()  // ← Optional
});

const createProfile = builder(UserProfileSchema);

// Step 9.1: Build without optional fields
const profile1 = createProfile()
  .withEmail('alice@example.com')
  .withName('Alice')
  .build(); // ✅ Works (bio and website are optional)

console.log(profile1);
// { email: 'alice@example.com', name: 'Alice' }

// Step 9.2: Build with optional fields
const profile2 = createProfile()
  .withEmail('bob@example.com')
  .withName('Bob')
  .withBio('Full-stack developer')
  .withWebsite('https://bob.dev')
  .build();

console.log(profile2);
// { email: 'bob@example.com', name: 'Bob', bio: '...', website: '...' }
```

---

## Step 10: Nested Objects

Builders work with nested objects too.

```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  country: z.string()
});

const UserWithAddressSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: AddressSchema  // ← Nested schema
});

const createUserWithAddress = builder(UserWithAddressSchema);

const user = createUserWithAddress()
  .withName('Charlie')
  .withEmail('charlie@example.com')
  .withAddress({
    street: '123 Main St',
    city: 'New York',
    country: 'USA'
  })
  .build();

console.log(user);
```

**Output:**
```json
{
  "name": "Charlie",
  "email": "charlie@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "country": "USA"
  }
}
```

---

## Step 11: Arrays and Collections

Working with arrays is straightforward.

```typescript
const TodoSchema = z.object({
  title: z.string(),
  items: z.array(z.string()),
  tags: z.array(z.string()).optional()
});

const createTodo = builder(TodoSchema);

const todo = createTodo()
  .withTitle('Shopping List')
  .withItems(['Milk', 'Eggs', 'Bread'])
  .withTags(['personal', 'urgent'])
  .build();

console.log(todo);
```

---

## Step 12: Performance Tips

Let's measure the performance difference between modes.

```typescript
import { performance } from 'perf_hooks';

function benchmark(name: string, fn: () => void, iterations: number = 100000) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const opsPerSec = Math.floor(iterations / ((end - start) / 1000));
  console.log(`${name}: ${opsPerSec.toLocaleString()} ops/sec`);
}

// Benchmark interface mode (fastest)
benchmark('Interface Builder', () => {
  createOrderDTO()
    .withId('ORD-123')
    .withTotal(1000)
    .withStatus('pending')
    .build();
});

// Benchmark class mode
benchmark('Class Builder', () => {
  createProduct()
    .withId(1)
    .withName('Product')
    .withPrice(100)
    .build();
});

// Benchmark Zod mode
benchmark('Zod Builder', () => {
  createUser()
    .withEmail('test@example.com')
    .withName('Test')
    .build();
});
```

**Expected Output:**
```
Interface Builder: 400,000 ops/sec
Class Builder: 300,000 ops/sec
Zod Builder: 100,000 ops/sec
```

**Takeaway:** Use interfaces when speed matters, Zod when validation matters.

---

## Step 13: Pool Statistics

Want to see how object pooling helps? Check the stats.

```typescript
import { getPoolStats, getDetailedPoolStats } from '@noony-serverless/type-builder';

// Create some builders
for (let i = 0; i < 1000; i++) {
  createUser()
    .withEmail(`user${i}@example.com`)
    .withName(`User ${i}`)
    .build();
}

// Check pool stats
const stats = getPoolStats();
console.log('Pool statistics:', stats);

const detailed = getDetailedPoolStats();
console.log('Hit rate:', (detailed.sync.averageHitRate * 100).toFixed(2) + '%');
```

**Output:**
```
Pool statistics: { sync: 10, async: 0 }
Hit rate: 98.50%
```

**What this means:** 98.5% of builder instances were reused (not recreated). That's why it's fast!

---

## Step 14: Common Patterns

### Pattern 1: Builder Factory

```typescript
// Create a factory for different user types
function userBuilderFactory(type: 'admin' | 'user' | 'guest') {
  const builders = {
    admin: builder(AdminSchema),
    user: builder(UserSchema),
    guest: builder(GuestSchema)
  };

  return builders[type];
}

const createAdmin = userBuilderFactory('admin');
const admin = createAdmin().withEmail('admin@example.com').build();
```

### Pattern 2: Partial Updates

```typescript
// Update existing objects
function updateUser(existing: User, updates: Partial<User>) {
  return createUser()
    .withEmail(updates.email ?? existing.email)
    .withName(updates.name ?? existing.name)
    .withAge(updates.age ?? existing.age)
    .build();
}

const updated = updateUser(user, { name: 'New Name' });
```

### Pattern 3: Builder Composition

```typescript
// Compose multiple builders
function createCompleteOrder(customerData: any, productData: any) {
  const customer = validateCustomer()
    .withEmail(customerData.email)
    .build();

  const product = createProduct()
    .withName(productData.name)
    .withPrice(productData.price)
    .build();

  return createOrder()
    .withCustomerId(customer.id)
    .withTotal(product.getPriceWithTax())
    .build();
}
```

---

## What You've Learned

Congratulations! 🎉 You now know how to:

✅ Create builders with Zod schemas (validation)
✅ Create builders with classes (methods + behavior)
✅ Create builders with interfaces (maximum speed)
✅ Handle validation errors gracefully
✅ Use async builders for high concurrency
✅ Work with optional fields
✅ Handle nested objects and arrays
✅ Measure and optimize performance
✅ Use common builder patterns

---

## Next Steps

### Learn More

- **[How-To Guide](./HOW-TO.md)** - Solve specific problems with recipes
- **[Reference](./REFERENCE.md)** - Complete API documentation
- **[Explanation](./EXPLANATION.md)** - Understand the design philosophy

### Try Building

Here are some exercises to practice:

1. **Blog Post Builder**
   - Title, content, author, tags, published date
   - Use Zod for validation

2. **Shopping Cart Builder**
   - Class with methods: `addItem()`, `removeItem()`, `getTotal()`
   - Use class builder

3. **API Response Transformer**
   - Convert database records to DTOs
   - Use interface builder for speed

4. **Multi-Step Form**
   - Build user registration in steps
   - Validate each step with builders

---

## Troubleshooting

### "Property doesn't exist" error

**Problem:**
```typescript
createOrder().withFoo('bar'); // ❌ Error
```

**Solution:** Check your schema/class/interface. Only properties defined there get `.withXYZ()` methods.

---

### "Cannot read property 'build'" error

**Problem:**
```typescript
const user = builder(UserSchema).withName('John'); // ❌ Wrong
```

**Solution:** You must call the builder function first:
```typescript
const user = builder(UserSchema)().withName('John'); // ✅ Correct
//                                ^^
```

---

### Interface builder needs array

**Problem:**
```typescript
const create = builder<Order>(); // ❌ Won't work
```

**Solution:** Provide the keys array:
```typescript
const create = builder<Order>(['id', 'total', 'status']); // ✅ Works
```

---

### Validation errors

**Problem:** Zod throws errors that crash your app.

**Solution:** Wrap in try-catch:
```typescript
try {
  const user = createUser().withEmail('invalid').build();
} catch (error) {
  console.error('Validation failed:', error);
}
```

---

## Resources

- **GitHub:** [https://github.com/your-org/typescript-bulder-lib](https://github.com/your-org/typescript-bulder-lib)
- **NPM:** [https://npmjs.com/@noony-serverless/type-builder](https://npmjs.com/@noony-serverless/type-builder)
- **Zod Docs:** [https://zod.dev](https://zod.dev)

---

**Happy Building! 🚀**
