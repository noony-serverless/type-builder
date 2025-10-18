import { builder } from '@ultra-fast-builder/core';
import { performance } from 'perf_hooks';

class Product {
  id!: number;
  name!: string;
  price!: number;
  category!: string;
  inStock!: boolean;
  createdAt!: Date;
  tags!: string[];
  metadata!: Record<string, any>;
  
  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }
  
  getTax(rate: number): number {
    return this.price * rate;
  }
  
  applyDiscount(percent: number): void {
    this.price *= (1 - percent / 100);
  }
  
  isExpensive(): boolean {
    return this.price > 1000;
  }
}

const createProduct = builder(Product);

export function runClassBenchmark(iterations = 1000000): void {
  console.log('🚀 Class Builder Benchmark');
  console.log('===========================');
  
  const startTime = performance.now();
  const startMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    const product = createProduct()
      .withId(i)
      .withName(`Product ${i}`)
      .withPrice(10 + (i % 1000))
      .withCategory(i % 2 === 0 ? 'Electronics' : 'Clothing')
      .withInStock(i % 3 !== 0)
      .withCreatedAt(new Date())
      .withTags(['featured', 'sale'])
      .withMetadata({ source: 'catalog', version: '2.0' })
      .build();
    
    // Test method calls
    product.getTax(0.08);
    if (product.isExpensive()) {
      product.applyDiscount(10);
    }
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

export function runClassMemoryTest(iterations = 100000): void {
  console.log('🧠 Class Memory Test');
  console.log('====================');
  
  const objects: Product[] = [];
  const startMemory = process.memoryUsage();
  
  for (let i = 0; i < iterations; i++) {
    const product = createProduct()
      .withId(i)
      .withName(`Product ${i}`)
      .withPrice(10 + (i % 1000))
      .withCategory(i % 2 === 0 ? 'Electronics' : 'Clothing')
      .withInStock(i % 3 !== 0)
      .withCreatedAt(new Date())
      .withTags(['featured', 'sale'])
      .withMetadata({ source: 'catalog', version: '2.0' })
      .build();
    
    objects.push(product);
  }
  
  const endMemory = process.memoryUsage();
  const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;
  const avgMemoryPerObject = memoryUsed / iterations;
  
  console.log(`Objects created: ${iterations.toLocaleString()}`);
  console.log(`Total memory: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Memory per object: ${avgMemoryPerObject.toFixed(2)} bytes`);
  console.log('');
}
