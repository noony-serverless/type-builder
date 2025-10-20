import { builder } from '@noony-serverless/type-builder';

class Product {
  id: number = 0;
  name: string = '';
  price: number = 0;
  category: string = '';
  inStock: boolean = false;
  createdAt: Date = new Date();
  tags: string[] = [];
  metadata: Record<string, any> = {};

  constructor(data: Partial<Product> = {}) {
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
  
  getDisplayName(): string {
    return `${this.name} - $${this.price}`;
  }
}

const createProduct = builder(Product);

export function runClassClinicTest(): void {
  console.log('🔬 Clinic.js Class Builder Test');
  console.log('================================');
  
  const iterations = 1000000;
  const startTime = Date.now();
  
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
    
    // Simulate business logic
    const tax = product.getTax(0.08);
    if (product.isExpensive()) {
      product.applyDiscount(10);
    }
    
    const displayName = product.getDisplayName();
    if (displayName.length > 50) {
      product.name = product.name.substring(0, 47) + '...';
    }
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const opsPerSecond = Math.round(iterations / (duration / 1000));
  
  console.log(`Completed ${iterations.toLocaleString()} operations in ${duration}ms`);
  console.log(`Rate: ${opsPerSecond.toLocaleString()} ops/sec`);
  console.log('');
}
