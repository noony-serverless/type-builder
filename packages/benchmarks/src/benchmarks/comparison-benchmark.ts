import { builder } from '@noony-serverless/type-builder';
import { z } from 'zod';
import { performance } from 'perf_hooks';

// Test data structures
interface UserDTO {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
}

class UserClass {
  id!: number;
  name!: string;
  email!: string;
  age!: number;
  isActive!: boolean;

  constructor(data: Partial<UserClass>) {
    Object.assign(this, data);
  }

  getDisplayName(): string {
    return `${this.name} (${this.email})`;
  }
}

const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean(),
});

// Builders
const createUserDTO = builder<UserDTO>(['id', 'name', 'email', 'age', 'isActive']);
const createUserClass = builder(UserClass);
const createUserZod = builder(UserSchema);

// Manual object creation for comparison
function createUserManual(data: Partial<UserDTO>): UserDTO {
  return {
    id: data.id || 0,
    name: data.name || '',
    email: data.email || '',
    age: data.age || 0,
    isActive: data.isActive || false,
  };
}

function createUserClassManual(data: Partial<UserClass>): UserClass {
  return new UserClass(data);
}

export function runComparisonBenchmark(iterations = 100000): void {
  console.log('🏆 Builder Comparison Benchmark');
  console.log('================================');

  const testData = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    isActive: true,
  };

  // Interface Builder
  console.log('Interface Builder:');
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    createUserDTO()
      .withId(testData.id)
      .withName(testData.name)
      .withEmail(testData.email)
      .withAge(testData.age)
      .withIsActive(testData.isActive)
      .build();
  }
  const end1 = performance.now();
  console.log(`  ${Math.round(iterations / ((end1 - start1) / 1000)).toLocaleString()} ops/sec`);

  // Class Builder
  console.log('Class Builder:');
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    createUserClass()
      .withId(testData.id)
      .withName(testData.name)
      .withEmail(testData.email)
      .withAge(testData.age)
      .withIsActive(testData.isActive)
      .build();
  }
  const end2 = performance.now();
  console.log(`  ${Math.round(iterations / ((end2 - start2) / 1000)).toLocaleString()} ops/sec`);

  // Zod Builder
  console.log('Zod Builder:');
  const start3 = performance.now();
  for (let i = 0; i < iterations; i++) {
    createUserZod()
      .withId(testData.id)
      .withName(testData.name)
      .withEmail(testData.email)
      .withAge(testData.age)
      .withIsActive(testData.isActive)
      .build();
  }
  const end3 = performance.now();
  console.log(`  ${Math.round(iterations / ((end3 - start3) / 1000)).toLocaleString()} ops/sec`);

  // Manual Object Creation
  console.log('Manual Object Creation:');
  const start4 = performance.now();
  for (let i = 0; i < iterations; i++) {
    createUserManual(testData);
  }
  const end4 = performance.now();
  console.log(`  ${Math.round(iterations / ((end4 - start4) / 1000)).toLocaleString()} ops/sec`);

  // Manual Class Creation
  console.log('Manual Class Creation:');
  const start5 = performance.now();
  for (let i = 0; i < iterations; i++) {
    createUserClassManual(testData);
  }
  const end5 = performance.now();
  console.log(`  ${Math.round(iterations / ((end5 - start5) / 1000)).toLocaleString()} ops/sec`);

  console.log('');
}

export function runMemoryComparison(iterations = 100000): void {
  console.log('🧠 Memory Usage Comparison');
  console.log('==========================');

  const testData = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    isActive: true,
  };

  const objects: any[] = [];
  const startMemory = process.memoryUsage();

  // Create objects using different methods
  for (let i = 0; i < iterations; i++) {
    if (i % 5 === 0) {
      objects.push(
        createUserDTO()
          .withId(testData.id)
          .withName(testData.name)
          .withEmail(testData.email)
          .withAge(testData.age)
          .withIsActive(testData.isActive)
          .build()
      );
    } else if (i % 5 === 1) {
      objects.push(
        createUserClass()
          .withId(testData.id)
          .withName(testData.name)
          .withEmail(testData.email)
          .withAge(testData.age)
          .withIsActive(testData.isActive)
          .build()
      );
    } else if (i % 5 === 2) {
      objects.push(
        createUserZod()
          .withId(testData.id)
          .withName(testData.name)
          .withEmail(testData.email)
          .withAge(testData.age)
          .withIsActive(testData.isActive)
          .build()
      );
    } else if (i % 5 === 3) {
      objects.push(createUserManual(testData));
    } else {
      objects.push(createUserClassManual(testData));
    }
  }

  const endMemory = process.memoryUsage();
  const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
  const avgMemoryPerObject = memoryUsed / iterations;

  console.log(`Objects created: ${iterations.toLocaleString()}`);
  console.log(`Total memory: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Memory per object: ${avgMemoryPerObject.toFixed(2)} bytes`);
  console.log('');
}
