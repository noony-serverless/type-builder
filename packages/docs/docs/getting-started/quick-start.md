# Quick Start

Get up and running with UltraFastBuilder in minutes!

## Basic Example

```typescript
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

// Define a Zod schema
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120)
});

// Create a builder (auto-detects Zod)
const createUser = builder(UserSchema);

// Build a user object
const user = createUser()
  .withId(1)
  .withName('John Doe')
  .withEmail('john@example.com')
  .withAge(30)
  .build();

console.log(user);
// Output: { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 }
```

## Three Builder Types

### 1. Zod Schema (Auto-detected)

```typescript
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

const createUser = builder(UserSchema); // ✨ Auto-detects Zod!
```

### 2. Class (Auto-detected)

```typescript
class Product {
  id!: number;
  name!: string;
  price!: number;
  
  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }
  
  getTax(): number {
    return this.price * 0.1;
  }
}

const createProduct = builder(Product); // ✨ Auto-detects Class!
```

### 3. Interface (Explicit)

```typescript
interface Order {
  id: string;
  total: number;
}

const createOrder = builder<Order>(['id', 'total']); // Explicit keys
```

## Async Validation

For non-blocking validation:

```typescript
import { builderAsync } from '@noony-serverless/type-builder';

const createUserAsync = builderAsync(UserSchema);

const user = await createUserAsync()
  .withName('John Doe')
  .withEmail('john@example.com')
  .buildAsync(); // ✅ Non-blocking validation
```

## Real-World Example

Here's a complete API endpoint example:

```typescript
import express from 'express';
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const app = express();

// Define validation schema
const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
});

// Create builder
const validateUserInput = builder(CreateUserSchema);

app.post('/api/users', async (req, res) => {
  try {
    // Validate and build in one step
    const userData = validateUserInput()
      .withEmail(req.body.email)
      .withPassword(req.body.password)
      .withName(req.body.name)
      .build(); // ✅ Validated!
    
    // Save to database
    const user = await db.users.create(userData);
    res.json(user);
    
  } catch (error) {
    // Zod provides detailed error messages
    res.status(400).json({ 
      error: error.errors 
    });
  }
});
```

## Performance

UltraFastBuilder is designed for maximum performance:

- **Interface Mode**: 400,000+ ops/sec
- **Class Mode**: 300,000+ ops/sec  
- **Zod Mode**: 100,000+ ops/sec

## Next Steps

- [Basic Usage Guide](./basic-usage.md)
- [Interface Builder Guide](../guides/interface-builder.md)
- [Class Builder Guide](../guides/class-builder.md)
- [Zod Builder Guide](../guides/zod-builder.md)
