# Zod Version Compatibility

UltraFastBuilder provides **full support for both Zod v3 and v4**, with automatic detection and backward compatibility built into the core library.

## Version Support

| Zod Version   | Support Status     | Notes                                 |
| ------------- | ------------------ | ------------------------------------- |
| **v4.0.0+**   | ✅ Fully Supported | Recommended for new projects          |
| **v3.22.0+**  | ✅ Fully Supported | Maintained for backward compatibility |
| **< v3.22.0** | ⚠️ Limited         | May work but not tested               |

## Installation

### For New Projects (Zod v4)

```bash
npm install @noony-serverless/type-builder zod
```

This will install the latest versions of both packages, including Zod v4.

### For Existing Projects (Zod v3)

If your project already uses Zod v3, UltraFastBuilder will work seamlessly:

```bash
npm install @noony-serverless/type-builder
# Your existing zod@^3.22.0 will continue to work
```

### Upgrading from Zod v3 to v4

```bash
npm install zod@^4.0.0
# UltraFastBuilder automatically detects and supports both versions
```

## Automatic Version Detection

UltraFastBuilder automatically detects which version of Zod you're using and adapts accordingly. **No configuration needed!**

```typescript
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

// Works with both Zod v3 and v4
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const createUser = builder(UserSchema);
// ✅ Auto-detects Zod version and works perfectly
```

## Zod v4 Breaking Changes (Handled by UltraFastBuilder)

UltraFastBuilder handles all Zod v4 breaking changes internally. Here's what changed and how we handle it:

### 1. Internal Property Access

**Zod v3:**

```typescript
// Internal: _def property
schema._def.shape();
```

**Zod v4:**

```typescript
// Internal: _zod.def property
schema._zod.def.shape();
```

**How UltraFastBuilder Handles It:**

- ✅ Automatically checks both locations
- ✅ Falls back gracefully between versions
- ✅ No action needed from you

### 2. Shape Access Method

**Zod v3:**

```typescript
// _def.shape was a function
const shape = schema._def.shape();
```

**Zod v4:**

```typescript
// .shape is now a property (getter)
const shape = schema.shape;
```

**How UltraFastBuilder Handles It:**

- ✅ Detects whether shape is a function or property
- ✅ Calls appropriately based on version
- ✅ No action needed from you

### 3. Type Generic Structure

**Zod v3:**

```typescript
class ZodType<Output, Def extends ZodTypeDef, Input = Output>
```

**Zod v4:**

```typescript
class ZodType<Output, Input = Output>
// Def generic removed for simpler types
```

**How UltraFastBuilder Handles It:**

- ✅ Conditional type inference supports both structures
- ✅ Full TypeScript type safety maintained
- ✅ No action needed from you

## Zod v4 API Changes (Your Code)

Some Zod API changes require updates in **your application code**:

### z.record() Requires Two Arguments

**Zod v3:**

```typescript
const MetadataSchema = z.object({
  metadata: z.record(z.any()), // One argument
});
```

**Zod v4:**

```typescript
const MetadataSchema = z.object({
  metadata: z.record(z.string(), z.any()), // Two arguments: key type, value type
});
```

**Migration:**

```typescript
// ❌ Zod v3 syntax (no longer works in v4)
z.record(z.any());

// ✅ Zod v4 syntax (works, more explicit)
z.record(z.string(), z.any());
```

### Common z.record() Patterns

```typescript
// String keys with any values
z.record(z.string(), z.any());

// String keys with typed values
z.record(z.string(), z.number());
z.record(z.string(), z.boolean());

// Specific string keys (enum-like)
z.record(z.enum(['admin', 'user', 'guest']), z.boolean());

// Number keys (if needed)
z.record(z.number(), z.string());
```

## Migration Guide

### Step 1: Check Your Zod Version

```bash
npm list zod
```

### Step 2: Update Zod (Optional)

```bash
# Upgrade to Zod v4
npm install zod@^4.0.0
```

### Step 3: Update Your z.record() Usage

Search for `z.record(` in your codebase:

```bash
grep -r "z.record(" src/
```

Update any single-argument `z.record()` calls to use two arguments:

```typescript
// Before (Zod v3)
metadata: z.record(z.any());
config: z.record(z.string());
settings: z.record(z.number());

// After (Zod v4)
metadata: z.record(z.string(), z.any());
config: z.record(z.string(), z.string());
settings: z.record(z.string(), z.number());
```

### Step 4: Test Your Application

```bash
# Run your tests
npm test

# Build your project
npm run build
```

### Step 5: No Changes Needed for UltraFastBuilder

UltraFastBuilder code remains the same:

```typescript
import { builder } from '@noony-serverless/type-builder';

// This works with both Zod v3 and v4
const createUser = builder(UserSchema);
const user = createUser().withName('John').withEmail('john@example.com').build();
```

## TypeScript Type Inference

Both versions provide full type inference:

### Zod v3

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const createUser = builder(UserSchema);
// TypeScript infers: FluentBuilder<{ id: number; name: string }>
```

### Zod v4

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const createUser = builder(UserSchema);
// TypeScript infers: FluentBuilder<{ id: number; name: string }>
```

Type inference works identically in both versions!

## Compatibility Guarantee

UltraFastBuilder commits to:

✅ **Support both Zod v3 and v4** indefinitely
✅ **Automatic version detection** with no configuration
✅ **Backward compatibility** for existing codebases
✅ **Type safety** maintained across both versions
✅ **No breaking changes** in the builder API

## Troubleshooting

### Issue: TypeScript errors with z.record()

**Error:**

```
Expected 2-3 arguments, but got 1.
```

**Solution:**
You're using Zod v4 with v3 syntax. Update your `z.record()` calls:

```typescript
// ❌ This
z.record(z.any());

// ✅ Change to this
z.record(z.string(), z.any());
```

### Issue: Version mismatch between dependencies

**Error:**

```
Type 'ZodObject<...>' is not assignable to type 'ZodType<...>'
```

**Solution:**
Ensure all packages use compatible Zod versions:

```bash
# Check Zod versions across all dependencies
npm list zod

# If multiple versions found, deduplicate
npm dedupe
```

### Issue: Type inference not working

**Solution:**
Ensure your TypeScript version is up to date:

```bash
npm install -D typescript@^5.0.0
```

Configure `tsconfig.json` for strict mode:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Working Examples

### Complete Example (Works with Both Versions)

```typescript
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

// Define schema (Zod v4 syntax shown)
const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(2).max(50),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  metadata: z.record(z.string(), z.any()), // v4 syntax
  tags: z.array(z.string()),
});

// Create builder (works with both Zod v3 and v4)
const createUser = builder(UserSchema);

// Use builder
try {
  const user = createUser()
    .withId(1)
    .withName('John Doe')
    .withEmail('john@example.com')
    .withAge(30)
    .withMetadata({ role: 'admin', source: 'api' })
    .withTags(['premium', 'verified'])
    .build();

  console.log('✅ User created:', user);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Validation failed:', error.errors);
  }
}
```

### Async Validation Example

```typescript
import { builderAsync } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Works with both Zod v3 and v4
const createUserAsync = builderAsync(UserSchema);

async function registerUser(input: any) {
  try {
    const user = await createUserAsync()
      .withEmail(input.email)
      .withPassword(input.password)
      .buildAsync(); // Non-blocking validation

    return { success: true, user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors };
    }
    throw error;
  }
}
```

## Performance Impact

Version detection has **zero performance impact** at runtime:

- Detection happens once during builder creation
- Cached for subsequent uses
- No overhead during `.build()` calls
- Same performance for both Zod v3 and v4

## Best Practices

### 1. Use Zod v4 for New Projects

```bash
# Start with the latest
npm install @noony-serverless/type-builder zod@^4.0.0
```

### 2. Migrate Gradually for Existing Projects

1. Update `z.record()` usage first
2. Run tests to verify everything works
3. Upgrade Zod when convenient
4. UltraFastBuilder handles the rest

### 3. Pin Zod Version in package.json

```json
{
  "dependencies": {
    "@noony-serverless/type-builder": "^1.2.0",
    "zod": "^4.0.0"
  }
}
```

### 4. Document Your Zod Version

Add to your project README:

```markdown
## Dependencies

- Zod v4.0+ for schema validation
- UltraFastBuilder v1.2+ (compatible with Zod v3 and v4)
```

## Further Resources

- [Zod v4 Migration Guide](https://zod.dev/v4/changelog) - Official Zod documentation
- [Zod Builder Guide](../guides/zod-builder.md) - UltraFastBuilder Zod usage
- [Installation Guide](./installation.md) - Setup instructions
- [API Reference](../api/api-reference.md) - Complete API documentation

## Need Help?

If you encounter issues with Zod version compatibility:

1. Check this guide for common solutions
2. Verify your Zod version: `npm list zod`
3. Report issues at [GitHub Issues](https://github.com/noony-serverless/type-builder/issues)
