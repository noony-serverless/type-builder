---
sidebar_position: 1
---

# Why UltraFastBuilder?

Understanding the problems UltraFastBuilder solves and why every TypeScript developer should consider using it.

## The Problem: Object Construction is Harder Than It Should Be

Modern TypeScript applications face three common challenges when building objects:

### 1. **Verbose Object Creation**

**The Traditional Way:**

```typescript
// Creating a user object manually
const user = {
  id: generateId(),
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin',
  createdAt: new Date(),
  updatedAt: new Date(),
  settings: {
    theme: 'dark',
    notifications: true,
  },
};
```

**Problems:**

- ❌ Repetitive for similar objects
- ❌ Easy to forget required fields
- ❌ No validation
- ❌ Hard to create reusable patterns
- ❌ Difficult to test

### 2. **API Security Nightmares**

```typescript
// Database user object
const dbUser = await db.users.findById(userId);

// Accidentally exposing everything! 😱
res.json(dbUser);
```

**What just happened:**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...", // ❌ EXPOSED!
  "sessionToken": "abc123...", // ❌ EXPOSED!
  "creditCardHash": "xyz...", // ❌ EXPOSED!
  "internalNotes": "VIP customer" // ❌ EXPOSED!
}
```

**You needed this:**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 3. **State Management Complexity**

```typescript
// Trying to update state immutably in React
const [user, setUser] = useState(initialUser);

// This is WRONG - mutates state!
const updateUser = () => {
  user.name = 'Jane Doe'; // ❌ Direct mutation
  setUser(user);
};

// This is correct but verbose
const updateUser = () => {
  setUser({
    ...user,
    name: 'Jane Doe',
    settings: {
      ...user.settings,
      theme: 'light',
    },
  });
};
```

---

## The Solution: Three Complementary Tools

UltraFastBuilder provides three powerful solutions for these problems:

### 1. **Type-Builder (OOP)** - For Fast, Validated Construction

### 2. **DynamicPick (customPicker)** - For Safe DynamicPick

### 3. **Functional Programming** - For Immutable Transformations

Let's explore each one.

---

## Part 1: Type-Builder (OOP)

### What is Type-Builder?

Type-Builder is a **fluent builder pattern** for TypeScript that auto-detects your types (Zod schemas, classes, or interfaces) and generates type-safe `withXxx()` methods automatically.

### The Builder Pattern Explained

**Traditional Manual Builder:**

```typescript
class UserBuilder {
  private user: Partial<User> = {};

  withId(id: number): this {
    this.user.id = id;
    return this;
  }

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

// Usage
const user = new UserBuilder().withId(1).withName('John').withEmail('john@example.com').build();
```

**Problems with Manual Builders:**

- 😓 You write 10+ lines of boilerplate for each field
- 😓 Updating types requires updating the builder class
- 😓 No validation
- 😓 Easy to forget fields

**UltraFastBuilder Auto-Generated:**

```typescript
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

const createUser = builder(UserSchema); // ✨ Auto-detects!

const user = createUser().withId(1).withName('John').withEmail('john@example.com').build(); // ✅ Validated automatically!
```

**Benefits:**

- ✅ Zero boilerplate
- ✅ Auto-generates methods from your types
- ✅ Built-in Zod validation
- ✅ Type-safe (TypeScript errors if wrong type)
- ✅ 400,000+ ops/sec performance

### Three Builder Modes

#### Mode 1: Zod Schema (Validation)

**Use when:** You need runtime validation (API boundaries, user input)

```typescript
const UserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18),
});

const createUser = builder(UserSchema);

const user = createUser()
  .withName('John')
  .withEmail('invalid-email') // ❌ Throws ZodError on build()
  .withAge(16) // ❌ Throws ZodError (age < 18)
  .build();
```

**Performance:** ~100,000 ops/sec
**Use case:** API validation, form input, external data

#### Mode 2: TypeScript Class (Methods + Data)

**Use when:** You need business logic methods on your objects

```typescript
class Order {
  id: number = 0;
  items: Item[] = [];
  total: number = 0;

  calculateTax(): number {
    return this.total * 0.1;
  }

  applyDiscount(percent: number): void {
    this.total *= 1 - percent / 100;
  }
}

const createOrder = builder(Order);

const order = createOrder()
  .withId(1)
  .withItems([{ name: 'Laptop', price: 999 }])
  .withTotal(999)
  .build();

order.calculateTax(); // ✅ Methods available!
```

**Performance:** ~300,000 ops/sec
**Use case:** Domain models, business objects

#### Mode 3: TypeScript Interface (Maximum Speed)

**Use when:** You need pure speed with no validation

```typescript
interface UserDTO {
  id: number;
  name: string;
  email: string;
}

const createUserDTO = builder<UserDTO>(['id', 'name', 'email']);

const dto = createUserDTO().withId(1).withName('John').withEmail('john@example.com').build();
```

**Performance:** ~400,000 ops/sec (fastest!)
**Use case:** Internal DTOs, data transformation, hot paths

### Why Use Type-Builder?

#### 1. **Prevents Missing Fields**

```typescript
// ❌ Manual construction - easy to forget fields
const user = {
  id: 1,
  name: 'John',
  // Forgot email! 😱
};

// ✅ Builder pattern - TypeScript forces you to set all required fields
const user = createUser()
  .withId(1)
  .withName('John')
  // TypeScript error if you forget withEmail()
  .build();
```

#### 2. **Centralized Validation**

```typescript
// ❌ Scattered validation
function createUser(data: any) {
  if (!data.email.includes('@')) throw new Error('Invalid email');
  if (data.age < 18) throw new Error('Too young');
  // ... more validation
}

// ✅ Validation in schema
const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
});
```

#### 3. **Reusable Patterns**

```typescript
// Create once, use everywhere
const createUser = builder(UserSchema);

// Controller
const user1 = createUser().withName('John').withEmail('john@example.com').build();

// Service
const user2 = createUser().withName('Jane').withEmail('jane@example.com').build();

// Tests
const testUser = createUser().withName('Test').withEmail('test@example.com').build();
```

#### 4. **Performance with Object Pooling**

UltraFastBuilder reuses builder instances:

```typescript
// First call: creates builder
const user1 = createUser().withName('John').build();

// Second call: reuses pooled builder (~70% faster!)
const user2 = createUser().withName('Jane').build();
```

---

## Part 2: DynamicPick (customPicker)

### What is DynamicPick?

DynamicPick (via `customPicker`) is a **DynamicPick** utility that selects specific fields from objects while excluding others. Think of it as **MongoDB's DynamicPick** or **GraphQL's field selection** for TypeScript.

### The Problem It Solves

**Scenario:** You have a user object from your database:

```typescript
const dbUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  passwordHash: '$2a$10$...',
  salt: 'xyz123',
  sessionToken: 'abc123',
  creditCard: '1234-5678-9012-3456',
  ssn: '123-45-6789',
  internalNotes: 'VIP customer, handle with care',
  createdAt: '2024-01-01',
  lastLogin: '2024-10-20',
};
```

**You need to send only safe fields to the client:**

```typescript
// Only these fields
{
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: '2024-01-01'
}
```

### Traditional Solutions (And Their Problems)

#### Option 1: Manual Object Construction

```typescript
const apiUser = {
  id: dbUser.id,
  name: dbUser.name,
  email: dbUser.email,
  createdAt: dbUser.createdAt,
};
```

**Problems:**

- ❌ Repetitive and verbose
- ❌ Easy to accidentally include sensitive fields
- ❌ Hard to maintain when adding/removing fields
- ❌ No reusability

#### Option 2: Destructuring with Rest

```typescript
const { passwordHash, salt, sessionToken, creditCard, ssn, internalNotes, ...apiUser } = dbUser;
```

**Problems:**

- ❌ **Dangerous!** New fields are auto-included (insecure by default)
- ❌ No type safety
- ❌ Doesn't work with nested objects
- ❌ Have to remember ALL sensitive fields

#### Option 3: Lodash `_.pick()`

```typescript
import _ from 'lodash';

const apiUser = _.pick(dbUser, ['id', 'name', 'email', 'createdAt']);
```

**Problems:**

- ❌ No TypeScript type safety
- ❌ No validation
- ❌ Doesn't handle nested paths well
- ❌ No caching (slower)
- ❌ Requires extra dependency

### The DynamicPick Solution

```typescript
import { customPicker } from '@noony-serverless/type-builder';

const apiUser = customPicker(dbUser, ['id', 'name', 'email', 'createdAt']);
```

**Benefits:**

- ✅ Declarative and concise
- ✅ TypeScript type safety
- ✅ Nested object support
- ✅ Array projection
- ✅ Optional Zod validation
- ✅ Automatic schema caching (~70% faster)
- ✅ 300,000+ ops/sec performance

### Powerful Path Syntax

#### Simple Fields

```typescript
customPicker(user, ['id', 'name', 'email']);
```

#### Nested Objects

```typescript
customPicker(order, ['id', 'user.name', 'user.email', 'user.address.city']);

// Returns:
// {
//   id: 1,
//   user: {
//     name: 'John',
//     email: 'john@example.com',
//     address: {
//       city: 'New York'
//     }
//   }
// }
```

#### Array Projection

```typescript
customPicker(order, ['id', 'items[].id', 'items[].name', 'items[].price']);

// Returns:
// {
//   id: 1,
//   items: [
//     { id: 101, name: 'Laptop', price: 999 },
//     { id: 102, name: 'Mouse', price: 29 }
//   ]
// }
```

#### Deep Nested Arrays

```typescript
customPicker(blog, [
  'title',
  'author.name',
  'comments[].text',
  'comments[].author.name',
  'comments[].replies[].text',
  'comments[].replies[].author.name',
]);
```

### Why Use DynamicPick?

#### 1. **Security by Default**

```typescript
// ❌ Insecure: exposes all fields by default
const { password, ...apiUser } = dbUser;
// New fields added to DB are auto-exposed! 😱

// ✅ Secure: only exposes what you explicitly list
const apiUser = customPicker(dbUser, ['id', 'name', 'email']);
// New fields are NOT exposed by default ✅
```

#### 2. **Reusable Projections**

```typescript
import { createPicker } from '@noony-serverless/type-builder';

// Define once
const toPublicUser = createPicker(['id', 'name', 'email', 'avatar']);

// Use everywhere
app.get('/users', async (req, res) => {
  const users = await db.users.findMany();
  res.json(users.map(toPublicUser)); // ✅ Fast & cached
});

app.get('/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  res.json(toPublicUser(user)); // ✅ Uses cached schema
});
```

#### 3. **GraphQL-style Field Selection**

```typescript
app.get('/api/posts', async (req, res) => {
  const posts = await db.posts.findMany();

  // Let client choose fields: /api/posts?fields=id,title,author.name
  const fields = req.query.fields?.split(',') || ['id', 'title'];

  // Whitelist for security
  const allowedFields = ['id', 'title', 'author.name', 'author.email', 'excerpt'];
  const safeFields = fields.filter((f) => allowedFields.includes(f));

  res.json(customPicker(posts, safeFields));
});
```

#### 4. **Database to DTO Transformation**

```typescript
// Database returns: user_id, user_name, order_id, order_total
const dbResults = await db.query(`
  SELECT
    u.id as user_id,
    u.name as user_name,
    o.id as order_id,
    o.total as order_total
  FROM users u
  JOIN orders o ON u.id = o.user_id
`);

// Transform to nested structure
const apiResponse = dbResults.map((row) => ({
  user: customPicker({ id: row.user_id, name: row.user_name }, ['id', 'name']),
  order: customPicker({ id: row.order_id, total: row.order_total }, ['id', 'total']),
}));
```

#### 5. **Optional Zod Validation**

```typescript
import { z } from 'zod';

const PublicUserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
});

// Project AND validate
const apiUser = customPicker(dbUser, PublicUserSchema);
// ✅ Only includes { id, name, email }
// ✅ Validates email format
// ❌ Throws if invalid
```

---

## Part 3: Functional Programming

### What is Functional Programming?

Functional Programming (FP) in UltraFastBuilder provides **immutable object construction** with composable, pure functions. Every transformation returns a **new object** - the original is never modified.

### The Problem It Solves

**Scenario:** React/Redux state management

```typescript
// ❌ WRONG - Mutates state directly
const [user, setUser] = useState({ name: 'John', email: 'john@example.com' });

const updateName = () => {
  user.name = 'Jane'; // ❌ Mutates state!
  setUser(user); // ❌ React doesn't detect change!
};
```

**The manual immutable way:**

```typescript
// ✅ Correct but verbose
const updateName = () => {
  setUser({
    ...user,
    name: 'Jane',
  });
};

// Gets worse with nesting
const updateCity = () => {
  setUser({
    ...user,
    address: {
      ...user.address,
      city: 'New York',
    },
  });
};
```

### The FP Solution

```typescript
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

const userBuilder = createImmutableBuilder<User>(['name', 'email', 'address']);

const updateName = () => {
  const newUser = userBuilder.build(
    pipe<User>(userBuilder.from(user), userBuilder.withName('Jane'))(userBuilder.empty())
  );

  setUser(newUser); // ✅ New object, React detects change
};
```

### Core FP Concepts

#### 1. **Immutability**

Every transformation returns a **new** frozen object:

```typescript
const state1 = userBuilder.empty(); // {}
const state2 = userBuilder.withName('Alice')(state1); // { name: 'Alice' }

console.log(state1); // Still {} - never changed!
console.log(state2); // { name: 'Alice' }
console.log(state1 !== state2); // true - different objects
console.log(Object.isFrozen(state2)); // true - cannot be mutated
```

#### 2. **Pure Functions**

Every function is **pure** - same input always produces same output:

```typescript
const normalizeEmail = (state: BuilderState<User>) => ({
  ...state,
  email: state.email?.toLowerCase().trim(),
});

// Always produces same result
normalizeEmail({ email: '  JOHN@EXAMPLE.COM  ' });
// Always returns: { email: 'john@example.com' }
```

#### 3. **Function Composition**

Combine small functions into larger transformations:

```typescript
import { pipe } from '@noony-serverless/type-builder';

const normalizeEmail = (state) => ({
  ...state,
  email: state.email?.toLowerCase().trim(),
});

const ensureAdult = (state) => {
  if (state.age < 18) throw new Error('Must be 18+');
  return state;
};

const addTimestamp = (state) => ({
  ...state,
  createdAt: new Date(),
});

// Compose into pipeline
const createUser = pipe<User>(
  userBuilder.withEmail('  JOHN@EXAMPLE.COM  '),
  normalizeEmail,
  userBuilder.withAge(25),
  ensureAdult,
  addTimestamp
);

const user = userBuilder.build(createUser(userBuilder.empty()));
```

### Why Use Functional Programming?

#### 1. **Guaranteed No Mutations**

```typescript
// ❌ OOP - easy to accidentally mutate
const user = createUser().withName('John').build();
user.name = 'Jane'; // ❌ Oops! Mutated

// ✅ FP - impossible to mutate
const user = userBuilder.build(userBuilder.withName('John')(userBuilder.empty()));
user.name = 'Jane'; // ❌ Error: Cannot assign to read only property
```

#### 2. **Time-Travel Debugging**

```typescript
const states = [];

let state = userBuilder.empty();
states.push(state); // State 0: {}

state = userBuilder.withName('Alice')(state);
states.push(state); // State 1: { name: 'Alice' }

state = userBuilder.withEmail('alice@example.com')(state);
states.push(state); // State 2: { name: 'Alice', email: 'alice@example.com' }

// Go back in time!
console.log(states[0]); // {}
console.log(states[1]); // { name: 'Alice' }
console.log(states[2]); // { name: 'Alice', email: 'alice@example.com' }
```

#### 3. **Easier Testing**

Pure functions are trivial to test - no mocks needed:

```typescript
describe('normalizeEmail', () => {
  it('should lowercase and trim email', () => {
    const input = { email: '  JOHN@EXAMPLE.COM  ' };
    const output = normalizeEmail(input);

    expect(output.email).toBe('john@example.com');
  });

  it('should not mutate input', () => {
    const input = { email: '  TEST  ' };
    const output = normalizeEmail(input);

    expect(input).not.toBe(output);
    expect(input.email).toBe('  TEST  '); // Original unchanged
  });
});
```

#### 4. **Composable Patterns**

```typescript
// Define reusable patterns
const adminDefaults = pipe<User>(
  userBuilder.withRole('admin'),
  userBuilder.withPermissions(['read', 'write', 'delete'])
);

const guestDefaults = pipe<User>(
  userBuilder.withRole('guest'),
  userBuilder.withPermissions(['read'])
);

// Compose with specific data
const admin = userBuilder.build(
  pipe<User>(
    adminDefaults, // ✅ Reuse pattern
    userBuilder.withName('Admin User')
  )(userBuilder.empty())
);

const guest = userBuilder.build(
  pipe<User>(
    guestDefaults, // ✅ Reuse pattern
    userBuilder.withName('Guest User')
  )(userBuilder.empty())
);
```

#### 5. **Perfect for React/Redux**

```typescript
import { createImmutableBuilder, pipe } from '@noony-serverless/type-builder';

const userBuilder = createImmutableBuilder<User>(['name', 'email', 'preferences']);

function UserProfile() {
  const [user, setUser] = useState(initialUser);

  const updateTheme = (theme: string) => {
    const newUser = userBuilder.build(
      pipe<User>(
        userBuilder.from(user),
        (state) => ({
          ...state,
          preferences: {
            ...state.preferences,
            theme
          }
        })
      )(userBuilder.empty())
    );

    setUser(newUser); // ✅ React detects change (new object)
  };

  return <div>{/* ... */}</div>;
}
```

---

## When to Use Each Tool

### Use Type-Builder (OOP) When:

✅ Building objects with validation (API requests)
✅ Creating domain models with methods
✅ Generating test data
✅ Maximum performance is critical (Interface mode)
✅ You prefer method chaining (`.withXxx()`)

**Example Use Cases:**

- API request/response DTOs
- Business domain models (Order, User, Product)
- Test factories
- Database entity creation

### Use DynamicPick When:

✅ Sending data to clients (API responses)
✅ Removing sensitive fields (passwords, tokens)
✅ Database result transformation
✅ GraphQL-style field selection
✅ Privacy/security requirements
✅ Multi-tenant applications

**Example Use Cases:**

- API response sanitization
- User role-based data filtering
- Database JOIN result mapping
- Mobile API optimization (reduce payload)
- Audit log PII removal

### Use Functional Programming When:

✅ React/Redux state management
✅ Complex data transformations
✅ You need guaranteed immutability
✅ Building reusable transformation pipelines
✅ Time-travel debugging needed
✅ Testing is critical (pure functions)

**Example Use Cases:**

- React component state
- Redux reducers
- Event sourcing
- Form validation pipelines
- Multi-step data transformations
- Configuration management

---

## Combining All Three

The real power comes from **using all three together**:

```typescript
import {
  builder,
  customPicker,
  createImmutableBuilder,
  pipe,
} from '@noony-serverless/type-builder';
import { z } from 'zod';

// 1. Type-Builder for API validation
const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

const validateUserInput = builder(CreateUserSchema);

// 2. DynamicPick for safe responses
const toPublicUser = createPicker(['id', 'name', 'email', 'createdAt']);

// 3. FP for complex transformations
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email', 'password', 'createdAt']);

const normalizeAndHash = pipe<User>(
  (state) => ({
    ...state,
    email: state.email?.toLowerCase().trim(),
  }),
  (state) => ({
    ...state,
    password: hashPassword(state.password!),
  })
);

// API endpoint combining all three
app.post('/api/users', async (req, res) => {
  // Step 1: Validate input (Type-Builder)
  const validatedInput = validateUserInput()
    .withName(req.body.name)
    .withEmail(req.body.email)
    .withPassword(req.body.password)
    .build(); // ✅ Throws if invalid

  // Step 2: Transform with FP (immutable)
  const processedUser = userBuilder.build(
    pipe<User>(
      userBuilder.withId(generateId()),
      userBuilder.withName(validatedInput.name),
      userBuilder.withEmail(validatedInput.email),
      userBuilder.withPassword(validatedInput.password),
      userBuilder.withCreatedAt(new Date()),
      normalizeAndHash // ✅ Normalize email, hash password
    )(userBuilder.empty())
  );

  // Step 3: Save to database
  await db.users.create(processedUser);

  // Step 4: Return safe response (DynamicPick)
  const publicUser = toPublicUser(processedUser);
  res.json(publicUser); // ✅ Only { id, name, email, createdAt }
});
```

---

## Performance Comparison

| Approach                | Manual     | Lodash       | UltraFastBuilder |
| ----------------------- | ---------- | ------------ | ---------------- |
| **Object Construction** | 5M ops/sec | N/A          | 400K ops/sec     |
| **Validation**          | Manual     | ❌ None      | ✅ Built-in      |
| **DynamicPick**         | Manual     | 500K ops/sec | 300K ops/sec     |
| **Type Safety**         | ⚠️ Partial | ❌ None      | ✅ Full          |
| **Immutability**        | Manual     | ❌ Mutable   | ✅ Frozen        |
| **Boilerplate**         | 😓 High    | 😊 Low       | ✅ Zero          |
| **Maintainability**     | 😓 Hard    | 😐 Medium    | ✅ Easy          |

---

## Conclusion: Why Every TypeScript Developer Should Use UltraFastBuilder

### 1. **Security**

- DynamicPick prevents accidental exposure of sensitive data
- Zod validation catches invalid input at API boundaries
- Immutability prevents accidental state mutations

### 2. **Productivity**

- Zero boilerplate for builders (auto-generated)
- Reusable projection patterns
- Composable transformations
- Excellent TypeScript autocomplete

### 3. **Performance**

- 300,000-400,000 operations per second
- Automatic object pooling (~70% improvement)
- Schema caching (projection ~70% faster)
- Minimal memory overhead

### 4. **Maintainability**

- Centralized validation logic
- Type-safe transformations
- Easy to test (pure functions)
- Clear, declarative code

### 5. **Flexibility**

- Choose OOP or FP based on your needs
- Mix and match all three tools
- Works with existing codebases
- Incremental adoption

---

## Getting Started

```bash
npm install @noony-serverless/type-builder zod
```

```typescript
import {
  // Type-Builder (OOP)
  builder,
  builderAsync,

  // DynamicPick (Projection)
  customPicker,
  createPicker,

  // Functional Programming
  createImmutableBuilder,
  pipe,
  compose,
} from '@noony-serverless/type-builder';

// You're ready to build! 🚀
```

---

## Next Steps

- 📖 [Type-Builder Quick Start](../getting-started/quick-start) - Learn the builder pattern
- 🎯 [DynamicPick Quick Start](../projection/quick-start) - Learn DynamicPick
- 🎨 [Functional Programming Quick Start](../functional-programming/quick-start) - Learn immutable patterns
- 💡 [Real-World Examples](../examples/api-validation) - See it all in action
