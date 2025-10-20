---
sidebar_position: 7
---

# Conditional Building & Templates

Create dynamic, reusable object construction patterns with conditional logic and templates.

## Conditional Building

Build different objects based on runtime conditions.

### Simple Conditionals

```typescript
import { pipe } from '@noony-serverless/type-builder';

interface User {
  id: number;
  name: string;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
}

// Simple ternary
const buildUser = (isAdmin: boolean) =>
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    isAdmin ? userBuilder.withRole('admin') : userBuilder.withRole('user')
  );

const admin = userBuilder.build(buildUser(true)(userBuilder.empty()));
const user = userBuilder.build(buildUser(false)(userBuilder.empty()));
```

### Using pipeIf

More declarative approach with `pipeIf`:

```typescript
import { pipeIf } from '@noony-serverless/type-builder';

const buildUser = (isAdmin: boolean) =>
  pipe<User>(
    userBuilder.withId(1),
    userBuilder.withName('Alice'),
    pipeIf(isAdmin, userBuilder.withRole('admin')),
    pipeIf(!isAdmin, userBuilder.withRole('user'))
  );
```

### Complex Conditionals

```typescript
const buildUser = (permissions: string[]) => {
  // Determine role based on permissions
  let roleTransform;

  if (permissions.includes('admin')) {
    roleTransform = pipe<User>(userBuilder.withRole('admin'), userBuilder.withActive(true));
  } else if (permissions.includes('moderator')) {
    roleTransform = pipe<User>(userBuilder.withRole('user'), userBuilder.withActive(true));
  } else {
    roleTransform = pipe<User>(userBuilder.withRole('guest'), userBuilder.withActive(false));
  }

  return pipe<User>(userBuilder.withId(generateId()), roleTransform);
};

const admin = userBuilder.build(buildUser(['admin', 'write', 'read'])(userBuilder.empty()));
```

---

## Using pipeWhen

Apply transformations based on current state:

```typescript
import { pipeWhen } from '@noony-serverless/type-builder';

const buildUser = pipe<User>(
  userBuilder.withAge(16),

  // If age < 18, set to 18
  pipeWhen(
    (state) => state.age !== undefined && state.age < 18,
    (state) => ({ ...state, age: 18 })
  ),

  // If no role set, default to 'user'
  pipeWhen((state) => !state.role, userBuilder.withRole('user'))
);

const user = userBuilder.build(buildUser(userBuilder.empty()));
// age: 18 (enforced minimum), role: 'user' (default)
```

---

## Reusable Templates

Create reusable patterns and compose them.

### Named Templates

```typescript
// Define templates for different user types
const adminTemplate = pipe<User>(userBuilder.withRole('admin'), userBuilder.withActive(true));

const guestTemplate = pipe<User>(userBuilder.withRole('guest'), userBuilder.withActive(false));

const moderatorTemplate = pipe<User>(userBuilder.withRole('user'), userBuilder.withActive(true));

// Use templates
const admin = userBuilder.build(
  pipe<User>(
    adminTemplate,
    userBuilder.withId(1),
    userBuilder.withName('Admin User')
  )(userBuilder.empty())
);

const guest = userBuilder.build(
  pipe<User>(
    guestTemplate,
    userBuilder.withId(2),
    userBuilder.withName('Guest User')
  )(userBuilder.empty())
);
```

### Template Composition

Compose templates to create more complex patterns:

```typescript
// Base templates
const verifiedUser = pipe<User>(userBuilder.withActive(true), userBuilder.withRole('user'));

const premiumUser = pipe<User>(
  verifiedUser, // Compose with another template
  userBuilder.withSubscription('premium')
);

const adminUser = pipe<User>(
  verifiedUser, // Reuse verified template
  userBuilder.withRole('admin') // Override role
);
```

---

## Factory Functions

Create factory functions that accept parameters and return transformations.

### Basic Factory

```typescript
const createUser = (id: number, name: string, template: Setter<User>) => {
  return pipe<User>(template, userBuilder.withId(id), userBuilder.withName(name));
};

const admin1 = userBuilder.build(createUser(1, 'Alice', adminTemplate)(userBuilder.empty()));

const guest1 = userBuilder.build(createUser(2, 'Bob', guestTemplate)(userBuilder.empty()));
```

### Parameterized Factory

```typescript
interface UserFactoryOptions {
  isAdmin: boolean;
  isActive: boolean;
  age?: number;
}

const createUserWithOptions = (id: number, name: string, options: UserFactoryOptions) => {
  return pipe<User>(
    userBuilder.withId(id),
    userBuilder.withName(name),
    userBuilder.withRole(options.isAdmin ? 'admin' : 'user'),
    userBuilder.withActive(options.isActive),
    pipeIf(!!options.age, userBuilder.withAge(options.age!))
  );
};

const user = userBuilder.build(
  createUserWithOptions(1, 'Alice', {
    isAdmin: true,
    isActive: true,
    age: 30,
  })(userBuilder.empty())
);
```

---

## Template Registry

Organize templates in a centralized registry:

```typescript
interface TemplateRegistry<T> {
  [key: string]: Setter<T>;
}

const userTemplates: TemplateRegistry<User> = {
  admin: pipe<User>(userBuilder.withRole('admin'), userBuilder.withActive(true)),

  guest: pipe<User>(userBuilder.withRole('guest'), userBuilder.withActive(false)),

  moderator: pipe<User>(userBuilder.withRole('user'), userBuilder.withActive(true)),

  premium: pipe<User>(
    userBuilder.withRole('user'),
    userBuilder.withActive(true),
    userBuilder.withSubscription('premium')
  ),
};

// Use templates
const createUserFromTemplate = (
  templateName: keyof typeof userTemplates,
  id: number,
  name: string
) => {
  const template = userTemplates[templateName];

  return pipe<User>(template, userBuilder.withId(id), userBuilder.withName(name));
};

const admin = userBuilder.build(createUserFromTemplate('admin', 1, 'Admin')(userBuilder.empty()));
```

---

## Conditional Template Selection

Select templates dynamically based on input:

```typescript
const selectTemplate = (userType: 'admin' | 'user' | 'guest') => {
  const templates = {
    admin: adminTemplate,
    user: moderatorTemplate,
    guest: guestTemplate,
  };

  return templates[userType];
};

const buildUser = (type: 'admin' | 'user' | 'guest', id: number, name: string) => {
  return pipe<User>(selectTemplate(type), userBuilder.withId(id), userBuilder.withName(name));
};

const admin = userBuilder.build(buildUser('admin', 1, 'Alice')(userBuilder.empty()));
```

---

## Real-World Examples

### Example 1: E-Commerce Product Builder

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
  discount?: number;
  featured?: boolean;
}

// Templates for different product types
const baseProduct = partial<Product>({
  inStock: true,
  featured: false,
});

const featuredProduct = pipe<Product>(baseProduct, productBuilder.withFeatured(true));

const saleProduct = (discountPercent: number) =>
  pipe<Product>(baseProduct, (state: BuilderState<Product>) => {
    if (state.price) {
      return Object.freeze({
        ...state,
        discount: discountPercent,
        price: state.price * (1 - discountPercent / 100),
      });
    }
    return state;
  });

// Factory function
const createProduct = (
  name: string,
  price: number,
  category: string,
  options: {
    featured?: boolean;
    discount?: number;
  } = {}
) => {
  let template;

  if (options.discount) {
    template = saleProduct(options.discount);
  } else if (options.featured) {
    template = featuredProduct;
  } else {
    template = baseProduct;
  }

  return productBuilder.build(
    pipe<Product>(
      template,
      productBuilder.withId(generateId()),
      productBuilder.withName(name),
      productBuilder.withPrice(price),
      productBuilder.withCategory(category)
    )(productBuilder.empty())
  );
};

// Usage
const laptop = createProduct('Gaming Laptop', 1299.99, 'Electronics', {
  featured: true,
});

const saleLaptop = createProduct('Gaming Laptop', 1299.99, 'Electronics', {
  discount: 20,
});
```

### Example 2: User Registration Flow

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

// Registration templates
const newUserDefaults = partial<User>({
  role: 'user',
  active: false,
  emailVerified: false,
  createdAt: new Date(),
});

const verifiedUserDefaults = partial<User>({
  role: 'user',
  active: true,
  emailVerified: true,
  createdAt: new Date(),
});

// Registration flow
const registerUser = (
  email: string,
  name: string,
  options: {
    autoVerify?: boolean;
    makeAdmin?: boolean;
  } = {}
) => {
  // Select base template
  const baseTemplate = options.autoVerify ? verifiedUserDefaults : newUserDefaults;

  return userBuilder.build(
    pipe<User>(
      baseTemplate,
      userBuilder.withId(generateId()),
      userBuilder.withEmail(email.toLowerCase().trim()),
      userBuilder.withName(name.trim()),

      // Conditional admin role
      pipeIf(!!options.makeAdmin, userBuilder.withRole('admin'))
    )(userBuilder.empty())
  );
};

// Usage
const regularUser = registerUser('alice@example.com', 'Alice');
const verifiedUser = registerUser('bob@example.com', 'Bob', {
  autoVerify: true,
});
const adminUser = registerUser('admin@example.com', 'Admin', {
  autoVerify: true,
  makeAdmin: true,
});
```

### Example 3: Configuration Builder

```typescript
interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  debug: boolean;
  logLevel: 'verbose' | 'info' | 'warn' | 'error';
  database: {
    host: string;
    port: number;
  };
}

// Environment templates
const developmentConfig = partial<AppConfig>({
  env: 'development',
  port: 3000,
  debug: true,
  logLevel: 'verbose',
  database: {
    host: 'localhost',
    port: 5432,
  },
});

const productionConfig = partial<AppConfig>({
  env: 'production',
  port: 80,
  debug: false,
  logLevel: 'error',
  database: {
    host: process.env.DB_HOST || 'db.example.com',
    port: 5432,
  },
});

const testConfig = partial<AppConfig>({
  env: 'test',
  port: 3001,
  debug: true,
  logLevel: 'warn',
  database: {
    host: 'localhost',
    port: 5433,
  },
});

// Config factory
const createConfig = (
  env: 'development' | 'production' | 'test',
  overrides?: Partial<AppConfig>
) => {
  const templates = {
    development: developmentConfig,
    production: productionConfig,
    test: testConfig,
  };

  return configBuilder.build(
    pipe<AppConfig>(
      templates[env],
      ...(overrides ? [partial(overrides)] : [])
    )(configBuilder.empty())
  );
};

// Usage
const devConfig = createConfig('development');
const prodConfig = createConfig('production', { port: 8080 });
const testConfig = createConfig('test');
```

---

## Best Practices

### 1. Template Naming Conventions

```typescript
// ✅ Good - descriptive names
const activeUserTemplate = pipe(...);
const guestUserTemplate = pipe(...);
const adminUserTemplate = pipe(...);

// ❌ Bad - unclear names
const template1 = pipe(...);
const t2 = pipe(...);
```

### 2. Template Organization

```typescript
// ✅ Good - organized by domain
const userTemplates = {
  admin: pipe(...),
  user: pipe(...),
  guest: pipe(...)
};

const productTemplates = {
  featured: pipe(...),
  sale: pipe(...),
  regular: pipe(...)
};

// ❌ Bad - all mixed together
const template1 = pipe(...);
const template2 = pipe(...);
const template3 = pipe(...);
```

### 3. Template Documentation

```typescript
/**
 * Admin user template
 * - Role: admin
 * - Active: true
 * - Has all permissions
 */
const adminTemplate = pipe<User>(
  userBuilder.withRole('admin'),
  userBuilder.withActive(true),
  userBuilder.withPermissions(['read', 'write', 'delete'])
);
```

### 4. Template Testing

```typescript
describe('User templates', () => {
  it('admin template sets correct defaults', () => {
    const user = userBuilder.build(
      pipe(adminTemplate, userBuilder.withId(1), userBuilder.withName('Admin'))(userBuilder.empty())
    );

    expect(user.role).toBe('admin');
    expect(user.active).toBe(true);
  });
});
```

---

## Summary

### Conditional Building

| Pattern        | Use Case          | Example                                            |
| -------------- | ----------------- | -------------------------------------------------- |
| Ternary        | Simple conditions | `isAdmin ? withRole('admin') : withRole('user')`   |
| `pipeIf`       | Single condition  | `pipeIf(isAdmin, withRole('admin'))`               |
| `pipeWhen`     | State-based       | `pipeWhen(state => !state.role, withRole('user'))` |
| Switch/If-else | Complex logic     | Multiple template selection                        |

### Templates

| Pattern              | Use Case          | Example                                |
| -------------------- | ----------------- | -------------------------------------- |
| Named templates      | Fixed patterns    | `adminTemplate`, `guestTemplate`       |
| Template composition | Reusable pieces   | `pipe(baseTemplate, specificTemplate)` |
| Template registry    | Organized storage | `templates[userType]`                  |
| Factory functions    | Parameterized     | `createUser(id, name, template)`       |

### Quick Reference

```typescript
// Conditional
const user = pipe<User>(
  pipeIf(condition, transform),
  pipeWhen((state) => predicate(state), transform)
);

// Templates
const template = pipe<User>(transform1, transform2);
const user = pipe(template, specificTransform);

// Factory
const create = (id, template) => pipe(template, withId(id));
```

---

## Next Steps

- 📖 [API Reference](./api-reference) - Complete functional API documentation
- 📚 [Real-World Examples](./real-world-examples) - Production-ready patterns
- 🔄 [Pipe and Compose](./pipe-compose) - Function composition patterns
