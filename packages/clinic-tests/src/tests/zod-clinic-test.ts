import { builder, builderAsync } from '@noony-serverless/type-builder';
import { z } from 'zod';

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean(),
  createdAt: z.date(),
  tags: z.array(z.string()),
  metadata: z.record(z.any()),
});

const createUser = builder(UserSchema as any) as any;
const createUserAsync = builderAsync(UserSchema as any) as any;

export function runZodClinicTest(): void {
  console.log('🔬 Clinic.js Zod Builder Test');
  console.log('==============================');

  const iterations = 100000;
  const startTime = Date.now();

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

    // Simulate validation and processing
    if (user.isActive && user.age > 30) {
      user.tags.push('senior');
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  const opsPerSecond = Math.round(iterations / (duration / 1000));

  console.log(`Completed ${iterations.toLocaleString()} operations in ${duration}ms`);
  console.log(`Rate: ${opsPerSecond.toLocaleString()} ops/sec`);
  console.log('');
}

export async function runZodAsyncClinicTest(): Promise<void> {
  console.log('🔬 Clinic.js Zod Async Builder Test');
  console.log('====================================');

  const iterations = 50000;
  const startTime = Date.now();

  for (let i = 0; i < iterations; i++) {
    const user = await createUserAsync()
      .withId(i)
      .withName(`User ${i}`)
      .withEmail(`user${i}@example.com`)
      .withAge(25 + (i % 50))
      .withIsActive(i % 2 === 0)
      .withCreatedAt(new Date())
      .withTags(['premium', 'verified'])
      .withMetadata({ source: 'api', version: '1.0' })
      .buildAsync();

    // Simulate async processing
    if (user.isActive && user.age > 30) {
      user.tags.push('senior');
    }
  }

  const endTime = Date.now();
  const duration = endTime - startTime;
  const opsPerSecond = Math.round(iterations / (duration / 1000));

  console.log(`Completed ${iterations.toLocaleString()} async operations in ${duration}ms`);
  console.log(`Rate: ${opsPerSecond.toLocaleString()} ops/sec`);
  console.log('');
}
