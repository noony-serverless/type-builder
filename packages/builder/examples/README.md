# UltraFastBuilder Examples

This directory contains practical examples demonstrating how to use the UltraFastBuilder library.

## Available Examples

### 1. [custom-picker.ts](./custom-picker.ts)
Comprehensive guide to the CustomPicker API for efficient data projection.

**Covers:**
- Path-based projection with dot notation and array support
- Zod schema-based projection with validation
- Shape-based projection using reference objects
- Helper functions (pickFields, omitFields, etc.)
- Pre-cached projectors for optimal performance
- Cache management and statistics
- Real-world API use cases
- Performance comparisons

**Run the example:**
```bash
npx tsx examples/custom-picker.ts
```

### 2. [unified-imports.ts](./unified-imports.ts)
Demonstrates how to use all functionality from a single unified import instead of multiple subpath imports.

**Covers:**
- Core builder functions
- Functional programming utilities
- Monads (Maybe, Either)
- Optics (Lens, Prism)
- Projection utilities

**Run the example:**
```bash
npx tsx examples/unified-imports.ts
```

## Running Examples

### Prerequisites
```bash
# Install dependencies
npm install

# Build the library
npm run build
```

### Execute Examples

Using tsx (recommended):
```bash
npx tsx examples/custom-picker.ts
```

Using ts-node:
```bash
npx ts-node examples/custom-picker.ts
```

Compile and run:
```bash
npx tsc examples/custom-picker.ts
node examples/custom-picker.js
```

## Key Concepts

### CustomPicker Performance

The CustomPicker API provides multiple projection methods optimized for different scenarios:

| Method | Performance | Best Use Case |
|--------|-------------|---------------|
| `customPicker(data, paths[])` | ~50-100k ops/sec | Dynamic field selection, flexible queries |
| `customPicker(data, zodSchema)` | ~30-60k ops/sec | Validation required, API boundaries |
| `projectByShape(data, shape)` | ~60-120k ops/sec | Type-safe DTOs, internal projections |
| `pickFields/omitFields` | ~50-100k ops/sec | Simple field filtering |
| `createPicker(paths)` | ~80-150k ops/sec | Repeated projections, high-throughput APIs |

### When to Use Each Method

**Path-based (`customPicker(data, ['field1', 'field2'])`):**
- Dynamic field selection
- GraphQL-like queries
- Flexible API filtering
- When field list changes frequently

**Zod-based (`customPicker(data, zodSchema)`):**
- API request/response validation
- External data sources
- When validation is critical
- Type safety + runtime validation

**Shape-based (`projectByShape(data, shape)`):**
- Internal DTOs
- Type-safe projections
- When structure is known at compile time
- Maximum performance with type safety

**Pre-cached (`createPicker(paths)`):**
- Repeated projections with same schema
- List endpoints
- Bulk operations
- High-throughput APIs
- Best performance for repeated operations

### Cache Performance

The schema cache provides ~70% performance improvement:

```typescript
// First call - builds and caches schema
const result1 = customPicker(data, schema); // ~10μs

// Subsequent calls - uses cached schema
const result2 = customPicker(data, schema); // ~3μs (70% faster!)
```

Monitor cache performance:
```typescript
const stats = getGlobalSchemaCacheStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

## Real-world Examples

### API Response Projection

```typescript
// Create reusable projectors for different API responses
const publicProfileProjector = createPicker<User>([
  'id', 'username', 'avatar'
]);

const authenticatedUserProjector = createPicker<User>([
  'id', 'username', 'email', 'settings', 'profile'
]);

// Use in API handlers
app.get('/api/users/:id', async (req, res) => {
  const user = await db.users.findOne(req.params.id);
  const isOwnProfile = req.user.id === user.id;

  const projected = isOwnProfile
    ? authenticatedUserProjector(user)
    : publicProfileProjector(user);

  res.json(projected);
});
```

### Data Validation Pipeline

```typescript
// Combine validation and projection
const createUserDTO = (rawData: unknown) => {
  try {
    return customPicker(rawData, UserSchema);
  } catch (error) {
    throw new ValidationError(error);
  }
};

app.post('/api/users', async (req, res) => {
  const validatedData = createUserDTO(req.body);
  const user = await db.users.create(validatedData);
  res.json(publicProfileProjector(user));
});
```

### Bulk Operations

```typescript
// Pre-cache for optimal performance
const orderSummaryProjector = createPicker<Order>([
  'orderNumber',
  'customer.name',
  'items[].product.name',
  'total',
  'status'
]);

// Process thousands of orders efficiently
const summaries = orders.map(orderSummaryProjector);
// Achieves ~150,000 ops/sec with pre-cached schema
```

## Additional Resources

- [Main Documentation](../../../README.md)
- [Performance Dashboard](../../clinic-tests/customPicker_dashboard.html)
- [API Reference](../src/projection/custom-picker.ts)
- [Type Definitions](../src/types.ts)

## Contributing

To add new examples:

1. Create a new `.ts` file in this directory
2. Follow the existing example structure
3. Add comprehensive comments
4. Include multiple use cases
5. Update this README with your example
6. Test with `npx tsx examples/your-example.ts`

## Questions?

- Check the [main README](../../../README.md)
- Review [CLAUDE.md](../../../CLAUDE.md) for development guidelines
- Run the performance dashboard for interactive examples
