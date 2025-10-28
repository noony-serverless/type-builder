import { builder, builderAsync } from '@noony-serverless/type-builder';
import { z } from 'zod';
import { performance } from 'perf_hooks';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean(),
  createdAt: z.date(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.any()),
});

type UserSchemaType = z.infer<typeof UserSchema>;

const createUser = builder<UserSchemaType>(UserSchema as any);
const createUserAsync = builderAsync(
  UserSchema
) as () => import('@noony-serverless/type-builder').FluentAsyncBuilder<UserSchemaType>;

export function runZodBenchmark(iterations = 100000): void {
  console.log('🚀 Zod Builder Benchmark');
  console.log('=========================');

  const startTime = performance.now();
  const startMemory = process.memoryUsage();

  for (let i = 0; i < iterations; i++) {
    const _user = createUser()
      .withId(i)
      .withName(`User ${i}`)
      .withEmail(`user${i}@example.com`)
      .withAge(25 + (i % 50))
      .withIsActive(i % 2 === 0)
      .withCreatedAt(new Date())
      .withTags(['premium', 'verified'])
      .withMetadata({ source: 'api', version: '1.0' })
      .build();
  }

  const endTime = performance.now();
  const endMemory = process.memoryUsage();

  const duration = endTime - startTime;
  const opsPerSecond = Math.round(iterations / (duration / 1000));
  const avgTimePerOp = duration / iterations;
  const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Duration: ${duration.toFixed(2)}ms`);
  console.log(`Operations/sec: ${opsPerSecond.toLocaleString()}`);
  console.log(`Avg time/op: ${avgTimePerOp.toFixed(4)}ms`);
  console.log(`Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Memory/op: ${(memoryUsed / iterations).toFixed(2)} bytes`);
  console.log('');
}

export async function runZodAsyncBenchmark(iterations = 10000): Promise<void> {
  console.log('🚀 Zod Async Builder Benchmark');
  console.log('===============================');

  const startTime = performance.now();
  const startMemory = process.memoryUsage();

  for (let i = 0; i < iterations; i++) {
    const builder = createUserAsync() as any;
    const _user = await builder
      .withId(i)
      .withName(`User ${i}`)
      .withEmail(`user${i}@example.com`)
      .withAge(25 + (i % 50))
      .withIsActive(i % 2 === 0)
      .withCreatedAt(new Date())
      .withTags(['premium', 'verified'])
      .withMetadata({ source: 'api', version: '1.0' })
      .buildAsync();
  }

  const endTime = performance.now();
  const endMemory = process.memoryUsage();

  const duration = endTime - startTime;
  const opsPerSecond = Math.round(iterations / (duration / 1000));
  const avgTimePerOp = duration / iterations;
  const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

  console.log(`Iterations: ${iterations.toLocaleString()}`);
  console.log(`Duration: ${duration.toFixed(2)}ms`);
  console.log(`Operations/sec: ${opsPerSecond.toLocaleString()}`);
  console.log(`Avg time/op: ${avgTimePerOp.toFixed(4)}ms`);
  console.log(`Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Memory/op: ${(memoryUsed / iterations).toFixed(2)} bytes`);
  console.log('');
}

export function runZodMemoryTest(iterations = 100000): void {
  console.log('🧠 Zod Memory Test');
  console.log('==================');

  const objects: any[] = [];
  const startMemory = process.memoryUsage();

  for (let i = 0; i < iterations; i++) {
    const user = createUser()
      .withId(i)
      .withName(`User ${i}`)
      .withEmail(`user${i}@example.com`)
      .withAge(25 + (i % 50))
      .withIsActive(i % 2 === 0)
      .withCreatedAt(new Date())
      .withTags(['premium', 'verified'])
      .withMetadata({ source: 'api', version: '1.0' })
      .build();

    objects.push(user);
  }

  const endMemory = process.memoryUsage();
  const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
  const avgMemoryPerObject = memoryUsed / iterations;

  console.log(`Objects created: ${iterations.toLocaleString()}`);
  console.log(`Total memory: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Memory per object: ${avgMemoryPerObject.toFixed(2)} bytes`);
  console.log('');
}
