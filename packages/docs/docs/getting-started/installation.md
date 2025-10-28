# Installation

## Prerequisites

- Node.js 18.0 or higher
- TypeScript 5.0 or higher (optional but recommended)

## Install UltraFastBuilder

```bash
npm install @noony-serverless/type-builder zod
```

## Peer Dependencies

UltraFastBuilder requires Zod for schema validation and **supports both Zod v3 and v4**:

```bash
npm install zod
```

**Version Compatibility:**

- ✅ Zod v4.0.0+ (Recommended for new projects)
- ✅ Zod v3.22.0+ (Fully supported for existing projects)

See [Zod Version Compatibility](./zod-compatibility.md) for detailed information about version support and migration.

## TypeScript Support

UltraFastBuilder is written in TypeScript and provides full type safety:

```bash
npm install -D typescript @types/node
```

## Package Managers

### npm

```bash
npm install @noony-serverless/type-builder zod
```

### yarn

```bash
yarn add @noony-serverless/type-builder zod
```

### pnpm

```bash
pnpm add @noony-serverless/type-builder zod
```

## Verify Installation

Create a simple test file to verify everything is working:

```typescript
// test.ts
import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const createUser = builder(UserSchema);

const user = createUser().withName('Test User').withEmail('test@example.com').build();

console.log('✅ UltraFastBuilder is working!', user);
```

Run it with:

```bash
npx tsx test.ts
```

You should see the user object printed to the console.

## Next Steps

- [Quick Start Guide](./quick-start.md)
- [Basic Usage](./basic-usage.md)
- [API Reference](../api/api-reference.md)
