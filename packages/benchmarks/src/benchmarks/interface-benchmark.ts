import { builder } from '@ultra-fast-builder/core';
import { performance } from 'perf_hooks';

interface UserDTO {
  id: number;
  name: string;
  email: string;
  age: number;
  isActive: boolean;
  createdAt: Date;
  tags: string[];
  metadata: Record<string, any>;
}

const createUserDTO = builder<UserDTO>([
  'id', 'name', 'email', 'age', 'isActive', 'createdAt', 'tags', 'metadata'
]);

export function runInterfaceBenchmark(iterations = 1000000): void {
  console.log('🚀 Interface Builder Benchmark');
  console.log('================================');
  
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    const user = createUserDTO()
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

export function runInterfaceMemoryTest(iterations = 100000): void {
  console.log('🧠 Interface Memory Test');
  console.log('========================');
  
  const objects: UserDTO[] = [];
  const startMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    const user = createUserDTO()
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
