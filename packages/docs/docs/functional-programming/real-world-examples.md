---
sidebar_position: 9
---

# Real-World Examples

Production-ready patterns and complete examples using functional programming with UltraFastBuilder.

## User Registration System

Complete user registration flow with validation, normalization, and side effects.

```typescript
import { createImmutableBuilder, pipe, partial, tap } from '@noony-serverless/type-builder';
import { z } from 'zod';

// Schema
const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum(['admin', 'user', 'guest']),
  active: z.boolean(),
  emailVerified: z.boolean(),
  createdAt: z.date()
});

type User = z.infer<typeof userSchema>;

// Builder
const userBuilder = createImmutableBuilder<User>(
  ['id', 'email', 'name', 'role', 'active', 'emailVerified', 'createdAt'],
  userSchema
);

// Defaults for new users
const newUserDefaults = partial<User>({
  role: 'user',
  active: false,
  emailVerified: false,
  createdAt: new Date()
});

// Email normalization
const normalizeEmail = (state: BuilderState<User>): BuilderState<User> => {
  if (state.email) {
    return Object.freeze({
      ...state,
      email: state.email.toLowerCase().trim()
    });
  }
  return state;
};

// Name normalization
const normalizeName = (state: BuilderState<User>): BuilderState<User> => {
  if (state.name) {
    return Object.freeze({
      ...state,
      name: state.name.trim()
    });
  }
  return state;
};

// Registration pipeline
const registerUser = (email: string, name: string): User => {
  return userBuilder.build(
    pipe<User>(
      // 1. Apply defaults
      newUserDefaults,

      // 2. Set user data
      userBuilder.withEmail(email),
      userBuilder.withName(name),
      userBuilder.withId(generateId()),

      // 3. Normalize data
      normalizeEmail,
      normalizeName,

      // 4. Side effects
      tap((state) => logger.info('User registered', { email: state.email })),
      tap((state) => sendWelcomeEmail(state.email!))
    )(userBuilder.empty())
  );
};

// Usage
const user = registerUser('ALICE@EXAMPLE.COM  ', '  Alice Smith  ');
// {
//   id: 12345,
//   email: 'alice@example.com',
//   name: 'Alice Smith',
//   role: 'user',
//   active: false,
//   emailVerified: false,
//   createdAt: Date
// }
```

---

## E-Commerce Product Catalog

Product management with templates, discounts, and inventory tracking.

```typescript
import { createImmutableBuilder, pipe, partial, pipeIf } from '@noony-serverless/type-builder';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  category: string;
  tags: string[];
  inStock: boolean;
  quantity: number;
  discount?: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productBuilder = createImmutableBuilder<Product>([
  'id', 'name', 'description', 'price', 'originalPrice', 'currency',
  'category', 'tags', 'inStock', 'quantity', 'discount', 'featured',
  'createdAt', 'updatedAt'
]);

// Base product defaults
const baseProductDefaults = partial<Product>({
  currency: 'USD',
  tags: [],
  inStock: true,
  quantity: 0,
  featured: false,
  createdAt: new Date(),
  updatedAt: new Date()
});

// Apply discount
const applyDiscount = (percent: number) => (state: BuilderState<Product>): BuilderState<Product> => {
  if (state.price) {
    const originalPrice = state.price;
    const discountedPrice = state.price * (1 - percent / 100);

    return Object.freeze({
      ...state,
      originalPrice,
      price: discountedPrice,
      discount: percent
    });
  }
  return state;
};

// Mark as featured
const markAsFeatured = (state: BuilderState<Product>): BuilderState<Product> => {
  return Object.freeze({
    ...state,
    featured: true
  });
};

// Update inventory
const updateInventory = (quantity: number) => (state: BuilderState<Product>): BuilderState<Product> => {
  return Object.freeze({
    ...state,
    quantity,
    inStock: quantity > 0
  });
};

// Product factory
const createProduct = (
  name: string,
  description: string,
  price: number,
  category: string,
  options: {
    quantity?: number;
    discount?: number;
    featured?: boolean;
    tags?: string[];
  } = {}
) => {
  return productBuilder.build(
    pipe<Product>(
      // Base defaults
      baseProductDefaults,

      // Product data
      productBuilder.withId(generateId()),
      productBuilder.withName(name),
      productBuilder.withDescription(description),
      productBuilder.withPrice(price),
      productBuilder.withCategory(category),

      // Optional: tags
      pipeIf(!!options.tags, productBuilder.withTags(options.tags || [])),

      // Optional: inventory
      pipeIf(options.quantity !== undefined, updateInventory(options.quantity || 0)),

      // Optional: discount
      pipeIf(!!options.discount, applyDiscount(options.discount || 0)),

      // Optional: featured
      pipeIf(!!options.featured, markAsFeatured),

      // Logging
      tap((state) => logger.info('Product created', { id: state.id, name: state.name }))
    )(productBuilder.empty())
  );
};

// Usage
const laptop = createProduct(
  'Gaming Laptop',
  'High-performance laptop for gaming',
  1299.99,
  'Electronics',
  {
    quantity: 50,
    discount: 20,
    featured: true,
    tags: ['gaming', 'laptop', 'electronics']
  }
);

// Result:
// {
//   id: 'prod_123',
//   name: 'Gaming Laptop',
//   description: 'High-performance laptop for gaming',
//   price: 1039.99,
//   originalPrice: 1299.99,
//   currency: 'USD',
//   category: 'Electronics',
//   tags: ['gaming', 'laptop', 'electronics'],
//   inStock: true,
//   quantity: 50,
//   discount: 20,
//   featured: true,
//   createdAt: Date,
//   updatedAt: Date
// }
```

---

## API Response Transformation

Transform external API responses to internal format with validation and normalization.

```typescript
import { createImmutableBuilder, pipe, compact, pick } from '@noony-serverless/type-builder';

// External API response format
interface APIUserResponse {
  user_id: number;
  user_name: string;
  user_email: string;
  is_active: boolean;
  created_timestamp: string;
  updated_timestamp: string;
  deleted_at: string | null;
}

// Internal user format
interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userBuilder = createImmutableBuilder<User>([
  'id', 'name', 'email', 'active', 'createdAt', 'updatedAt'
]);

// Transform API response to internal format
const transformAPIUser = (apiUser: APIUserResponse): User => {
  // Map API fields to internal fields
  const mapped: Partial<User> = {
    id: apiUser.user_id,
    name: apiUser.user_name,
    email: apiUser.user_email,
    active: apiUser.is_active,
    createdAt: new Date(apiUser.created_timestamp),
    updatedAt: new Date(apiUser.updated_timestamp)
  };

  return userBuilder.build(
    pipe<User>(
      // Start with mapped data
      () => mapped as BuilderState<User>,

      // Normalize email
      (state) => Object.freeze({
        ...state,
        email: state.email?.toLowerCase().trim()
      }),

      // Remove null/undefined values
      compact,

      // Pick only needed fields
      pick(['id', 'name', 'email', 'active', 'createdAt', 'updatedAt'])
    )()
  );
};

// Batch transform
const transformUsers = (apiUsers: APIUserResponse[]): User[] => {
  return apiUsers
    .filter(u => !u.deleted_at)  // Exclude deleted users
    .map(transformAPIUser);
};

// Usage
const apiResponse = await fetch('/api/users').then(r => r.json());
const users = transformUsers(apiResponse);
```

---

## Form Validation Pipeline

Complex form validation with multiple validation steps and error handling.

```typescript
import { createImmutableBuilder, pipe, pipeWhen, tap } from '@noony-serverless/type-builder';

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  message: string;
  subscribe: boolean;
  consent: boolean;
}

const formBuilder = createImmutableBuilder<ContactForm>([
  'name', 'email', 'phone', 'message', 'subscribe', 'consent'
]);

// Validation errors
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validators
const validateRequired = (field: keyof ContactForm) =>
  (state: BuilderState<ContactForm>): BuilderState<ContactForm> => {
    if (!state[field]) {
      throw new ValidationError(field, `${field} is required`);
    }
    return state;
  };

const validateEmail = (state: BuilderState<ContactForm>): BuilderState<ContactForm> => {
  if (state.email && !/\S+@\S+\.\S+/.test(state.email)) {
    throw new ValidationError('email', 'Invalid email format');
  }
  return state;
};

const validatePhone = (state: BuilderState<ContactForm>): BuilderState<ContactForm> => {
  if (state.phone && !/^\+?[\d\s-()]+$/.test(state.phone)) {
    throw new ValidationError('phone', 'Invalid phone format');
  }
  return state;
};

const validateConsent = (state: BuilderState<ContactForm>): BuilderState<ContactForm> => {
  if (!state.consent) {
    throw new ValidationError('consent', 'You must agree to the terms');
  }
  return state;
};

// Sanitizers
const sanitizeString = (field: keyof ContactForm) =>
  (state: BuilderState<ContactForm>): BuilderState<ContactForm> => {
    const value = state[field];
    if (typeof value === 'string') {
      return Object.freeze({
        ...state,
        [field]: value.trim()
      });
    }
    return state;
  };

// Validation pipeline
const validateContactForm = (formData: Partial<ContactForm>): ContactForm => {
  return formBuilder.build(
    pipe<ContactForm>(
      // Start with form data
      () => formData as BuilderState<ContactForm>,

      // Sanitize inputs
      sanitizeString('name'),
      sanitizeString('email'),
      sanitizeString('phone'),
      sanitizeString('message'),

      // Required fields
      validateRequired('name'),
      validateRequired('email'),
      validateRequired('message'),

      // Format validation
      validateEmail,
      pipeWhen(
        (state) => !!state.phone,
        validatePhone
      ),

      // Consent validation
      validateConsent,

      // Logging
      tap((state) => logger.info('Form validated', {
        email: state.email,
        subscribe: state.subscribe
      }))
    )()
  );
};

// Usage in API endpoint
app.post('/contact', async (req, res) => {
  try {
    const validatedForm = validateContactForm(req.body);

    // Save to database
    await saveContactForm(validatedForm);

    // Send confirmation email
    await sendConfirmationEmail(validatedForm.email);

    res.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        error: error.message,
        field: error.field
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
```

---

## React State Management

Managing immutable state in React with functional builders.

```typescript
import { createImmutableBuilder, pipe, partial } from '@noony-serverless/type-builder';
import { useState } from 'react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

const todoBuilder = createImmutableBuilder<TodoItem>([
  'id', 'text', 'completed', 'createdAt', 'priority'
]);

// Default values for new todos
const newTodoDefaults = partial<TodoItem>({
  completed: false,
  createdAt: new Date(),
  priority: 'medium'
});

// React component
function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const addTodo = (text: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    const newTodo = todoBuilder.build(
      pipe<TodoItem>(
        newTodoDefaults,
        todoBuilder.withId(generateId()),
        todoBuilder.withText(text),
        todoBuilder.withPriority(priority)
      )(todoBuilder.empty())
    );

    setTodos(prev => [...prev, newTodo]);
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        // Create new todo with toggled completed status
        return todoBuilder.build(
          pipe<TodoItem>(
            () => ({ ...todo, completed: !todo.completed } as BuilderState<TodoItem>)
          )()
        );
      }
      return todo;
    }));
  };

  const updatePriority = (id: string, priority: 'low' | 'medium' | 'high') => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === id) {
        return todoBuilder.build(
          pipe<TodoItem>(
            () => ({ ...todo, priority } as BuilderState<TodoItem>)
          )()
        );
      }
      return todo;
    }));
  };

  return (
    <div>
      {todos.map(todo => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={() => toggleTodo(todo.id)}
          onUpdatePriority={(p) => updatePriority(todo.id, p)}
        />
      ))}
    </div>
  );
}
```

---

## Configuration Management

Multi-environment configuration with defaults and overrides.

```typescript
import { createImmutableBuilder, pipe, partial, pipeIf } from '@noony-serverless/type-builder';

interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    name: string;
    ssl: boolean;
  };
  redis: {
    host: string;
    port: number;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    pretty: boolean;
  };
  features: {
    analytics: boolean;
    newUI: boolean;
  };
}

const configBuilder = createImmutableBuilder<AppConfig>([
  'env', 'port', 'host', 'database', 'redis', 'api', 'logging', 'features'
]);

// Base defaults (shared across all environments)
const baseDefaults = partial<AppConfig>({
  host: '0.0.0.0',
  api: {
    timeout: 5000,
    retries: 3,
    baseUrl: ''
  },
  features: {
    analytics: false,
    newUI: false
  }
});

// Development environment
const developmentConfig = pipe<AppConfig>(
  baseDefaults,
  configBuilder.withEnv('development'),
  configBuilder.withPort(3000),
  configBuilder.withDatabase({
    host: 'localhost',
    port: 5432,
    name: 'app_dev',
    ssl: false
  }),
  configBuilder.withRedis({
    host: 'localhost',
    port: 6379
  }),
  configBuilder.withLogging({
    level: 'debug',
    pretty: true
  }),
  configBuilder.withFeatures({
    analytics: false,
    newUI: true
  })
);

// Production environment
const productionConfig = pipe<AppConfig>(
  baseDefaults,
  configBuilder.withEnv('production'),
  configBuilder.withPort(80),
  configBuilder.withDatabase({
    host: process.env.DB_HOST || 'db.example.com',
    port: 5432,
    name: 'app_prod',
    ssl: true
  }),
  configBuilder.withRedis({
    host: process.env.REDIS_HOST || 'redis.example.com',
    port: 6379
  }),
  configBuilder.withLogging({
    level: 'error',
    pretty: false
  }),
  configBuilder.withFeatures({
    analytics: true,
    newUI: false
  })
);

// Load config based on environment
const loadConfig = (env: string = process.env.NODE_ENV || 'development'): AppConfig => {
  const baseConfig = env === 'production' ? productionConfig : developmentConfig;

  return configBuilder.build(
    pipe<AppConfig>(
      baseConfig,

      // Allow environment variable overrides
      pipeIf(
        !!process.env.PORT,
        configBuilder.withPort(parseInt(process.env.PORT || '3000'))
      ),

      pipeIf(
        !!process.env.API_BASE_URL,
        (state) => Object.freeze({
          ...state,
          api: { ...state.api!, baseUrl: process.env.API_BASE_URL! }
        })
      )
    )(configBuilder.empty())
  );
};

// Usage
const config = loadConfig();
console.log(`Starting server on ${config.host}:${config.port}`);
```

---

## Summary

These examples demonstrate:

1. **User Registration** - Validation, normalization, side effects
2. **E-Commerce** - Templates, discounts, inventory management
3. **API Transformation** - External to internal format conversion
4. **Form Validation** - Multi-step validation with error handling
5. **React State** - Immutable state management
6. **Configuration** - Multi-environment config with overrides

### Key Patterns

- ✅ Use `partial` for defaults and templates
- ✅ Use `pipe` for sequential transformations
- ✅ Use `pipeIf`/`pipeWhen` for conditional logic
- ✅ Use `tap` for side effects (logging, analytics)
- ✅ Use `compact` and `pick`/`omit` for data sanitization
- ✅ Validate with Zod schemas at build time

---

## Next Steps

- 📖 [API Reference](./api-reference) - Complete functional API
- 🎯 [Quick Start](./quick-start) - Get started quickly
- 🔄 [Pipe and Compose](./pipe-compose) - Composition patterns
