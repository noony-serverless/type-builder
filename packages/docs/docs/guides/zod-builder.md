# Zod Builder

The **Zod Builder** mode combines fluent builder patterns with Zod's powerful runtime validation, perfect for API boundaries and external data.

## Overview

- **Performance**: 100,000+ operations per second (~10μs per operation)
- **Memory**: ~120 bytes per object
- **Use Case**: API validation, external user input
- **Feature**: Automatic runtime validation with detailed error messages

## When to Use

Use Zod mode when:

- ✅ Validating API request bodies
- ✅ Processing external user input
- ✅ Parsing file uploads or form data
- ✅ Need detailed validation error messages
- ✅ Working with untrusted data sources

Don't use Zod mode when:

- ❌ Processing internal, already-validated data (use [Interface mode](./interface-builder.md))
- ❌ Need methods on objects (use [Class mode](./class-builder.md))
- ❌ Maximum performance is critical (validation has overhead)

## Basic Usage

### Defining a Zod Builder

```typescript
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(0).max(120),
});

// Auto-detects it's a Zod schema
const createUser = builder(UserSchema);

const user = createUser().withName('John Doe').withEmail('john@example.com').withAge(30).build(); // ✅ Validates automatically

console.log(user); // { name: 'John Doe', email: 'john@example.com', age: 30 }
```

### Validation Errors

```typescript
try {
  const invalidUser = createUser()
    .withName('J') // Too short!
    .withEmail('invalid-email') // Not an email!
    .withAge(-5) // Negative age!
    .build();
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.errors);
    // [
    //   { path: ['name'], message: 'String must contain at least 2 character(s)' },
    //   { path: ['email'], message: 'Invalid email' },
    //   { path: ['age'], message: 'Number must be greater than or equal to 0' }
    // ]
  }
}
```

## Real-World Examples

### Express API Validation

```typescript
import express from 'express';
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const app = express();
app.use(express.json());

// Define validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
});

const validateCreateUser = builder(CreateUserSchema);

app.post('/api/users', async (req, res) => {
  try {
    // Validate and build in one step
    const userData = validateCreateUser()
      .withEmail(req.body.email)
      .withPassword(req.body.password)
      .withName(req.body.name)
      .build(); // ✅ Throws ZodError if invalid

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Save to database
    const user = await db.users.create({
      ...userData,
      password: hashedPassword,
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Complex Nested Schemas

```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zipCode: z.string().regex(/^\d{5}$/),
  country: z.string(),
});

const OrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const CreateOrderSchema = z.object({
  customerId: z.string(),
  items: z.array(OrderItemSchema).min(1),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional(),
});

const validateOrder = builder(CreateOrderSchema);

const order = validateOrder()
  .withCustomerId('customer-123')
  .withItems([
    { productId: 'prod-1', quantity: 2, price: 29.99 },
    { productId: 'prod-2', quantity: 1, price: 49.99 },
  ])
  .withShippingAddress({
    street: '123 Main St',
    city: 'New York',
    zipCode: '10001',
    country: 'USA',
  })
  .build();
```

### Form Validation

```typescript
const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must agree to terms',
  }),
});

const validateContactForm = builder(ContactFormSchema);

app.post('/api/contact', async (req, res) => {
  try {
    const formData = validateContactForm()
      .withName(req.body.name)
      .withEmail(req.body.email)
      .withSubject(req.body.subject)
      .withMessage(req.body.message)
      .withAgreeToTerms(req.body.agreeToTerms)
      .build();

    await sendEmail(formData);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format errors for client
      const fieldErrors = error.errors.reduce(
        (acc, err) => {
          const field = err.path[0];
          acc[field] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      return res.status(400).json({ errors: fieldErrors });
    }
    res.status(500).json({ error: 'Server error' });
  }
});
```

## Advanced Zod Features

### Custom Refinements

```typescript
const PasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const validatePassword = builder(PasswordSchema);

try {
  validatePassword().withPassword('secret123').withConfirmPassword('different').build();
} catch (error) {
  // Error: "Passwords don't match"
}
```

### Transformations

```typescript
const UserInputSchema = z.object({
  email: z.string().email().toLowerCase(), // Transforms to lowercase
  age: z.string().transform((val) => parseInt(val, 10)), // String to number
  createdAt: z.string().transform((val) => new Date(val)), // String to Date
});

const validateUserInput = builder(UserInputSchema);

const user = validateUserInput()
  .withEmail('JOHN@EXAMPLE.COM')
  .withAge('30')
  .withCreatedAt('2024-01-15')
  .build();

console.log(user);
// {
//   email: 'john@example.com', // Lowercased
//   age: 30,                   // Parsed to number
//   createdAt: Date(2024-01-15) // Parsed to Date
// }
```

### Enums and Unions

```typescript
const OrderStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'cancelled']),
  priority: z.union([z.literal('low'), z.literal('medium'), z.literal('high')]),
});

const validateOrder = builder(OrderStatusSchema);

const order = validateOrder()
  .withId('order-123')
  .withStatus('processing')
  .withPriority('high')
  .build();
```

## Error Handling

### Detailed Error Messages

```typescript
const ProductSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative'),
});

const validateProduct = builder(ProductSchema);

try {
  validateProduct().withName('AB').withPrice(-10).withStock(5.5).build();
} catch (error) {
  if (error instanceof z.ZodError) {
    error.errors.forEach((err) => {
      console.log(`${err.path.join('.')}: ${err.message}`);
    });
    // name: Product name must be at least 3 characters
    // price: Price must be positive
    // stock: Stock must be an integer
  }
}
```

### Graceful Error Handling

```typescript
function createUserSafely(input: any) {
  try {
    return {
      success: true,
      data: createUser().withName(input.name).withEmail(input.email).build(),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}

const result = createUserSafely({ name: 'J', email: 'invalid' });
if (!result.success) {
  console.log('Validation failed:', result.errors);
}
```

## Auto-Detection

UltraFastBuilder automatically detects Zod schemas:

```typescript
// ✅ Auto-detects these as Zod schemas
builder(z.object({ name: z.string() }));
builder(z.array(z.string()));
builder(z.record(z.number()));
builder(z.union([z.string(), z.number()]));
```

Detection checks for:

- `parse()` method
- `safeParse()` method
- `_def` property

## Type Safety

Full TypeScript inference from Zod schemas:

```typescript
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const create = builder(UserSchema);

// ✅ Type-safe
create().withName('John').withAge(30);

// ❌ TypeScript errors
create().withName(123); // Error: Expected string
create().withAge('invalid'); // Error: Expected number
create().withInvalid('foo'); // Error: Property doesn't exist
```

## Performance Tips

### 1. Reuse Builder Factories

```typescript
// ✅ GOOD: Create once
const createUser = builder(UserSchema);

app.post('/users', (req) => {
  const user = createUser().withEmail(req.body.email).build();
});

// ❌ BAD: Create on every request
app.post('/users', (req) => {
  const createUser = builder(UserSchema); // Slow!
  const user = createUser().withEmail(req.body.email).build();
});
```

### 2. Use Async for Non-Blocking

For high-concurrency scenarios, use async validation:

```typescript
import { builderAsync } from '@ultra-fast-builder/core';

const createUser = builderAsync(UserSchema);

app.post('/users', async (req, res) => {
  const user = await createUser().withEmail(req.body.email).buildAsync(); // Non-blocking
});
```

See [Async Validation Guide](./async-validation.md) for details.

## Best Practices

### 1. Validate at Boundaries

```typescript
// ✅ GOOD: Validate external input
app.post('/api/users', (req) => {
  const validated = validateUser().withEmail(req.body.email).build(); // Validate here

  processUser(validated); // Safe to use
});

// ❌ BAD: Validating internal data
function processUser(user: User) {
  const validated = validateUser().withEmail(user.email).build(); // Wasteful - already validated
}
```

### 2. Provide Clear Error Messages

```typescript
const UserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});
```

### 3. Use Transformations Wisely

```typescript
const InputSchema = z.object({
  email: z.string().email().toLowerCase().trim(), // Clean input
  tags: z.string().transform((s) => s.split(',')), // Parse CSV
  date: z.string().transform((s) => new Date(s)), // Parse date
});
```

## Comparison with Other Modes

| Feature            | Zod            | Interface     | Class         |
| ------------------ | -------------- | ------------- | ------------- |
| **Speed**          | 100k ops/sec   | 400k ops/sec  | 300k ops/sec  |
| **Validation**     | Automatic      | None          | Manual        |
| **Error Messages** | Detailed       | None          | Custom        |
| **Use Case**       | API boundaries | Internal DTOs | Domain models |

## Next Steps

- [Async Validation Guide](./async-validation.md) - Non-blocking validation
- [API Reference: Core Functions](../api/api-reference.md) - Complete API
- [Examples: API Validation](../examples/api-validation.md) - More examples
- [Interface Builder](./interface-builder.md) - For internal data
