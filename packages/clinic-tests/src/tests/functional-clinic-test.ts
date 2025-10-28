import { createImmutableBuilder, pipe, compose, curry2 } from '@noony-serverless/type-builder';
import { z } from 'zod';

// Define the User type
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  tags: string[];
  metadata: Record<string, any>;
}

const _UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean(),
  createdAt: z.date(),
  tags: z.array(z.string()),
  metadata: z.record(z.string(), z.any()),
});

// Create immutable builder
const userBuilder = createImmutableBuilder<User>([
  'id',
  'name',
  'email',
  'age',
  'isActive',
  'createdAt',
  'tags',
  'metadata',
]);

export function runFunctionalClinicTest(): void {
  console.log('🔬 Clinic.js Functional Programming Test');
  console.log('=======================================');

  const iterations = 100000;
  const startTime = Date.now();

  // Test 1: Basic pipe operations
  console.log('Testing pipe operations...');
  for (let i = 0; i < iterations; i++) {
    const user = pipe<User>(
      userBuilder.withId(i),
      userBuilder.withName(`User ${i}`),
      userBuilder.withEmail(`user${i}@example.com`),
      userBuilder.withAge(25 + (i % 50)),
      userBuilder.withIsActive(i % 2 === 0),
      userBuilder.withCreatedAt(new Date()),
      userBuilder.withTags(['premium', 'verified']),
      userBuilder.withMetadata({ source: 'api', version: '1.0' })
    )(userBuilder.empty());

    const _finalUser = userBuilder.build(user);
  }

  // Test 2: Compose operations
  console.log('Testing compose operations...');
  const createBasicUser = compose(
    userBuilder.withId(1),
    userBuilder.withName('Test User'),
    userBuilder.withEmail('test@example.com')
  );

  const createActiveUser = compose(
    userBuilder.withIsActive(true),
    userBuilder.withAge(25),
    userBuilder.withCreatedAt(new Date())
  );

  for (let i = 0; i < iterations; i++) {
    const user = pipe<User>(
      createBasicUser,
      createActiveUser,
      userBuilder.withTags(['functional', 'test']),
      userBuilder.withMetadata({ iteration: i })
    )(userBuilder.empty());

    const _finalUser = userBuilder.build(user);
  }

  // Test 3: Higher-order functions
  console.log('Testing higher-order functions...');
  const users: User[] = [];
  for (let i = 0; i < 1000; i++) {
    const user = userBuilder.build(
      pipe<User>(
        userBuilder.withId(i),
        userBuilder.withName(`User ${i}`),
        userBuilder.withEmail(`user${i}@example.com`),
        userBuilder.withAge(25 + (i % 50)),
        userBuilder.withIsActive(i % 2 === 0),
        userBuilder.withCreatedAt(new Date()),
        userBuilder.withTags(['premium', 'verified']),
        userBuilder.withMetadata({ source: 'api', version: '1.0' })
      )(userBuilder.empty())
    );
    users.push(user);
  }

  // Test filtering
  const activeUsers = users.filter((user) => user.isActive);
  console.log(`Active users: ${activeUsers.length}`);

  // Test mapping
  const userNames = users.map((user) => user.name);
  console.log(`User names collected: ${userNames.length}`);

  // Test reduction
  const totalAge = users.reduce((sum, user) => sum + user.age, 0);
  console.log(`Total age: ${totalAge}`);

  // Test some/every
  const hasActiveUsers = users.some((user) => user.isActive);
  const allUsersActive = users.every((user) => user.isActive);
  console.log(`Has active users: ${hasActiveUsers}`);
  console.log(`All users active: ${allUsersActive}`);

  // Test 4: Currying and partial application
  console.log('Testing currying and partial application...');
  const curriedWithId = curry2((id: number, state: any) => userBuilder.withId(id)(state));
  const partialWithName = (state: any) => userBuilder.withName('Default Name')(state);

  for (let i = 0; i < iterations / 10; i++) {
    const user = pipe<User>(
      curriedWithId(i),
      partialWithName,
      userBuilder.withEmail(`user${i}@example.com`),
      userBuilder.withAge(25 + (i % 50)),
      userBuilder.withIsActive(i % 2 === 0),
      userBuilder.withCreatedAt(new Date()),
      userBuilder.withTags(['curried', 'test']),
      userBuilder.withMetadata({ curried: true })
    )(userBuilder.empty());

    const _finalUser = userBuilder.build(user);
  }

  // Test 5: Object manipulation functions
  console.log('Testing object manipulation functions...');
  const sampleUser = userBuilder.build(
    pipe<User>(
      userBuilder.withId(1),
      userBuilder.withName('Sample User'),
      userBuilder.withEmail('sample@example.com'),
      userBuilder.withAge(30),
      userBuilder.withIsActive(true),
      userBuilder.withCreatedAt(new Date()),
      userBuilder.withTags(['sample', 'test']),
      userBuilder.withMetadata({ sample: true })
    )(userBuilder.empty())
  );

  console.log(`Sample user created: ${sampleUser.name}`);
  console.log(`Sample user age: ${sampleUser.age}`);
  console.log(`Sample user active: ${sampleUser.isActive}`);

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`\nFunctional Programming Test Results:`);
  console.log(`Total iterations: ${iterations.toLocaleString()}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Operations/sec: ${Math.round(iterations / (duration / 1000)).toLocaleString()}`);
  console.log(`Avg time/op: ${(duration / iterations).toFixed(4)}ms`);
  console.log('');
}

export function runFunctionalMemoryTest(): void {
  console.log('🧠 Functional Programming Memory Test');
  console.log('====================================');

  const iterations = 100000;
  const objects: User[] = [];
  const startMemory = process.memoryUsage();

  for (let i = 0; i < iterations; i++) {
    const user = userBuilder.build(
      pipe<User>(
        userBuilder.withId(i),
        userBuilder.withName(`User ${i}`),
        userBuilder.withEmail(`user${i}@example.com`),
        userBuilder.withAge(25 + (i % 50)),
        userBuilder.withIsActive(i % 2 === 0),
        userBuilder.withCreatedAt(new Date()),
        userBuilder.withTags(['premium', 'verified']),
        userBuilder.withMetadata({ source: 'api', version: '1.0' })
      )(userBuilder.empty())
    );

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
