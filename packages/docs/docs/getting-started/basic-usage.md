# Basic Usage

Learn the fundamentals of using UltraFastBuilder in your TypeScript projects.

## Builder Basics

Every builder follows the same pattern:

1. Create a builder factory function
2. Call the factory to get a builder instance
3. Chain `.withX()` methods to set properties
4. Call `.build()` to create the final object

```typescript
import { builder } from '@noony-serverless/type-builder';

// Step 1: Create builder factory
const createUser = builder<User>(['name', 'email']);

// Step 2: Get builder instance
const userBuilder = createUser();

// Step 3: Chain methods
userBuilder.withName('John Doe').withEmail('john@example.com');

// Step 4: Build the object
const user = userBuilder.build();
```

## Fluent API

The builder uses a fluent API, allowing you to chain methods:

```typescript
const user = createUser().withName('John Doe').withEmail('john@example.com').withAge(30).build();
```

Each `.withX()` method returns the builder instance, enabling the chain.

## Type Safety

All builder methods are fully typed based on your input:

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
}

const createProduct = builder<Product>(['id', 'name', 'price']);

const product = createProduct()
  .withId(1) // TypeScript knows this is a number
  .withName('Laptop') // TypeScript knows this is a string
  .withPrice(999.99) // TypeScript knows this is a number
  .build();

// TypeScript catches errors:
// createProduct().withId('invalid'); // Error: Type 'string' not assignable to 'number'
// createProduct().withFoo('bar');    // Error: Property 'withFoo' does not exist
```

## Partial Objects

Builders work with partial data - you don't have to set all properties:

```typescript
const partialUser = createUser()
  .withName('John')
  // email not set
  .build();

console.log(partialUser); // { name: 'John' }
```

However, TypeScript will still type the result as a complete `User` object. For runtime validation, use Zod mode.

## Reusing Builder Factories

Always reuse your builder factory functions for best performance:

```typescript
// ✅ GOOD: Create once, reuse many times
const createUser = builder(UserSchema);

for (const data of users) {
  const user = createUser().withName(data.name).withEmail(data.email).build();
}

// ❌ BAD: Creating new factory each time is slow
for (const data of users) {
  const createUser = builder(UserSchema); // Creates new pool!
  const user = createUser().withName(data.name).build();
}
```

## Method Name Generation

Method names are generated from property names using this pattern:

```typescript
// Property name → Method name
name         → withName()
email        → withEmail()
firstName    → withFirstName()
isActive     → withIsActive()
user_id      → withUser_id()
```

The method name is always `with` + capitalized property name.

## Common Patterns

### Building Objects from External Data

```typescript
app.post('/api/users', (req, res) => {
  const user = createUser().withName(req.body.name).withEmail(req.body.email).build();

  res.json(user);
});
```

### Creating Test Data

```typescript
describe('User tests', () => {
  it('should create a valid user', () => {
    const user = createUser().withName('Test User').withEmail('test@example.com').build();

    expect(user.name).toBe('Test User');
  });
});
```

### Data Transformation

```typescript
const users = await db.users.findMany();

const userDTOs = users.map((user) =>
  createUserDTO()
    .withId(user.id)
    .withName(`${user.firstName} ${user.lastName}`)
    .withEmail(user.email)
    .build()
);
```

## Next Steps

- [Interface Builder Guide](../guides/interface-builder.md) - Fastest mode for plain objects
- [Class Builder Guide](../guides/class-builder.md) - For objects with methods
- [Zod Builder Guide](../guides/zod-builder.md) - For validated objects
- [API Reference](../api/core-functions.md) - Complete API documentation
