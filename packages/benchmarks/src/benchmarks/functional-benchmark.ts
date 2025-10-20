import { 
  createImmutableBuilder, 
  pipe, 
  compose, 
  curry2, 
  partialApply
} from '@noony-serverless/type-builder';
import { z } from 'zod';
import { performance } from 'perf_hooks';

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

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean(),
  createdAt: z.date(),
  tags: z.array(z.string()),
  metadata: z.record(z.any())
});

// Create immutable builder
const userBuilder = createImmutableBuilder<User>(['id', 'name', 'email', 'age', 'isActive', 'createdAt', 'tags', 'metadata']);

export function runFunctionalBenchmark(iterations = 100000): void {
  console.log('🚀 Functional Programming Benchmark');
  console.log('===================================');
  
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    // Using pipe for left-to-right composition
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
    
    const finalUser = userBuilder.build(user);
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

export function runComposeBenchmark(iterations = 100000): void {
  console.log('🚀 Compose Function Benchmark');
  console.log('=============================');
  
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  // Create composed functions
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
    
    const finalUser = userBuilder.build(user);
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

export function runHigherOrderBenchmark(iterations = 10000): void {
  console.log('🚀 Higher-Order Functions Benchmark');
  console.log('===================================');
  
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  // Create a list of users for processing
  const users: User[] = [];
  for (let i = 0; i < iterations; i++) {
    const user = userBuilder.build(pipe<User>(
      userBuilder.withId(i),
      userBuilder.withName(`User ${i}`),
      userBuilder.withEmail(`user${i}@example.com`),
      userBuilder.withAge(25 + (i % 50)),
      userBuilder.withIsActive(i % 2 === 0),
      userBuilder.withCreatedAt(new Date()),
      userBuilder.withTags(['premium', 'verified']),
      userBuilder.withMetadata({ source: 'api', version: '1.0' })
    )(userBuilder.empty()));
    users.push(user);
  }
  
  // Test higher-order functions
  const activeUsers = users.filter(user => user.isActive);
  const userNames = users.map(user => user.name);
  const totalAge = users.reduce((sum, user) => sum + user.age, 0);
  const hasActiveUsers = users.some(user => user.isActive);
  const allUsersActive = users.every(user => user.isActive);
  
  // Test builder transformations
  const transformedUsers = users.map(user => {
    const state = userBuilder.empty();
    return userBuilder.build(pipe<User>(
      userBuilder.withId(user.id),
      userBuilder.withName(user.name.toUpperCase()),
      userBuilder.withEmail(user.email),
      userBuilder.withAge(user.age + 1),
      userBuilder.withIsActive(!user.isActive),
      userBuilder.withCreatedAt(user.createdAt),
      userBuilder.withTags([...user.tags, 'transformed']),
      userBuilder.withMetadata({ ...user.metadata, transformed: true })
    )(state));
  });
  
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
  console.log(`Active users: ${activeUsers.length}`);
  console.log(`Total age: ${totalAge}`);
  console.log(`Has active users: ${hasActiveUsers}`);
  console.log(`All users active: ${allUsersActive}`);
  console.log(`Transformed users: ${transformedUsers.length}`);
  console.log('');
}

export function runFunctionalMemoryTest(iterations = 100000): void {
  console.log('🧠 Functional Programming Memory Test');
  console.log('====================================');
  
  const objects: User[] = [];
  const startMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    const user = userBuilder.build(pipe<User>(
      userBuilder.withId(i),
      userBuilder.withName(`User ${i}`),
      userBuilder.withEmail(`user${i}@example.com`),
      userBuilder.withAge(25 + (i % 50)),
      userBuilder.withIsActive(i % 2 === 0),
      userBuilder.withCreatedAt(new Date()),
      userBuilder.withTags(['premium', 'verified']),
      userBuilder.withMetadata({ source: 'api', version: '1.0' })
    )(userBuilder.empty()));
    
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
