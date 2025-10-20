# API Validation Examples

Real-world examples of using UltraFastBuilder for API validation with Zod.

## Express REST API

### Basic Validation

```typescript
import express from 'express';
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const app = express();
app.use(express.json());

// Define validation schemas
const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters')
});

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional()
});

// Create validators
const validateCreateUser = builder(CreateUserSchema);
const validateUpdateUser = builder(UpdateUserSchema);

// POST /api/users - Create user
app.post('/api/users', async (req, res) => {
  try {
    const userData = validateCreateUser()
      .withEmail(req.body.email)
      .withPassword(req.body.password)
      .withName(req.body.name)
      .build();

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await db.users.create({
      ...userData,
      password: hashedPassword
    });

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:id - Update user
app.patch('/api/users/:id', async (req, res) => {
  try {
    const updates = validateUpdateUser();

    if (req.body.email) updates.withEmail(req.body.email);
    if (req.body.name) updates.withName(req.body.name);

    const validated = updates.build();

    const user = await db.users.update({
      where: { id: req.params.id },
      data: validated
    });

    res.json(user);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000);
```

### Nested Objects

```typescript
const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}$/)
});

const CreateOrderSchema = z.object({
  customerId: z.string().uuid(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive()
  })).min(1, 'Order must have at least one item'),
  shippingAddress: AddressSchema,
  billingAddress: AddressSchema.optional()
});

const validateOrder = builder(CreateOrderSchema);

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = validateOrder()
      .withCustomerId(req.body.customerId)
      .withItems(req.body.items)
      .withShippingAddress(req.body.shippingAddress)
      .withBillingAddress(req.body.billingAddress)
      .build();

    const order = await db.orders.create(orderData);
    res.status(201).json(order);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

## GraphQL Resolvers

```typescript
import { z } from 'zod';
import { builder } from '@noony-serverless/type-builder';

// Input validation schemas
const CreatePostInput = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10),
  authorId: z.string(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional()
});

const UpdatePostInput = z.object({
  title: z.string().min(3).max(200).optional(),
  content: z.string().min(10).optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional()
});

const validateCreatePost = builder(CreatePostInput);
const validateUpdatePost = builder(UpdatePostInput);

const resolvers = {
  Mutation: {
    createPost: async (_, { input }, context) => {
      try {
        const postData = validateCreatePost()
          .withTitle(input.title)
          .withContent(input.content)
          .withAuthorId(context.user.id)
          .withTags(input.tags || [])
          .withPublished(input.published ?? false)
          .build();

        return await db.posts.create(postData);

      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    },

    updatePost: async (_, { id, input }, context) => {
      try {
        const updates = validateUpdatePost();

        if (input.title) updates.withTitle(input.title);
        if (input.content) updates.withContent(input.content);
        if (input.tags) updates.withTags(input.tags);
        if (input.published !== undefined) updates.withPublished(input.published);

        const validated = updates.build();

        return await db.posts.update({
          where: { id },
          data: validated
        });

      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
      }
    }
  }
};
```

## Validation Middleware

```typescript
// Create reusable validation middleware
function validateRequest<T>(schema: z.ZodSchema<T>) {
  const validate = builder(schema);

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const builder = validate();

      // Dynamically build from request body
      Object.keys(req.body).forEach(key => {
        const methodName = `with${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        if (typeof builder[methodName] === 'function') {
          builder[methodName](req.body[key]);
        }
      });

      req.validatedData = builder.build();
      next();

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Usage
const UserSchema = z.object({
  email: z.string().email(),
  name: z.string()
});

app.post('/api/users',
  validateRequest(UserSchema),
  async (req, res) => {
    const user = await db.users.create(req.validatedData);
    res.json(user);
  }
);
```

## File Upload Validation

```typescript
const FileUploadSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
  size: z.number().max(5 * 1024 * 1024, 'File too large (max 5MB)'),
  content: z.string() // base64
});

const validateFileUpload = builder(FileUploadSchema);

app.post('/api/upload', async (req, res) => {
  try {
    const fileData = validateFileUpload()
      .withFilename(req.body.filename)
      .withMimeType(req.body.mimeType)
      .withSize(req.body.size)
      .withContent(req.body.content)
      .build();

    const url = await uploadToS3(fileData);
    res.json({ url });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});
```

## Query Parameter Validation

```typescript
const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query required'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['relevance', 'date', 'popularity']).default('relevance'),
  filters: z.object({
    category: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional()
  }).optional()
});

const validateSearchQuery = builder(SearchQuerySchema);

app.get('/api/search', async (req, res) => {
  try {
    const query = validateSearchQuery()
      .withQ(req.query.q as string)
      .withPage(req.query.page as any)
      .withLimit(req.query.limit as any)
      .withSortBy((req.query.sortBy as any) || 'relevance')
      .withFilters(req.query.filters as any)
      .build();

    const results = await searchProducts(query);
    res.json(results);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Search failed' });
  }
});
```

## Webhook Validation

```typescript
const WebhookPayloadSchema = z.object({
  event: z.enum(['user.created', 'user.updated', 'user.deleted']),
  timestamp: z.coerce.date(),
  data: z.object({
    userId: z.string(),
    changes: z.record(z.any())
  }),
  signature: z.string()
});

const validateWebhook = builder(WebhookPayloadSchema);

app.post('/webhooks/user-events', async (req, res) => {
  try {
    const payload = validateWebhook()
      .withEvent(req.body.event)
      .withTimestamp(req.body.timestamp)
      .withData(req.body.data)
      .withSignature(req.headers['x-signature'] as string)
      .build();

    // Verify signature
    const isValid = verifyWebhookSignature(payload);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    await processWebhookEvent(payload);
    res.json({ received: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
```

## Next Steps

- [Domain Models](./domain-models.md) - Class-based examples
- [Data Transformation](./data-transformation.md) - DTO examples
- [Zod Builder Guide](../guides/zod-builder.md) - Learn more about validation
