import { builder } from '@ultra-fast-builder/core';

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

export function runInterfaceClinicTest(): void {
  console.log('🔬 Clinic.js Interface Builder Test');
  console.log('===================================');
  
  const iterations = 1000000;
  const startTime = Date.now();
  
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
    
    // Simulate some work with the object
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
