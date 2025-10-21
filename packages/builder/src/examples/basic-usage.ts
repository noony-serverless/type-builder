import builder, { builderAsync } from '../index';
import { z } from 'zod';

// Example 1: Zod Schema (Auto-detected)
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  isActive: z.boolean(),
});

const createUser = builder(UserSchema);

const user = createUser()
  .withId(1)
  .withName('John Doe')
  .withEmail('john@example.com')
  .withAge(30)
  .withIsActive(true)
  .build();

console.log('User:', user);

// Example 2: Class (Auto-detected)
class Product {
  id!: number;
  name!: string;
  price!: number;
  category!: string;

  constructor(data: Partial<Product>) {
    Object.assign(this, data);
  }

  getTax(rate: number): number {
    return this.price * rate;
  }
}

const createProduct = builder(Product);

const product = createProduct()
  .withId(1)
  .withName('Laptop')
  .withPrice(999)
  .withCategory('Electronics')
  .build();

console.log('Product:', product);
console.log('Tax:', product.getTax(0.08));

// Example 3: Interface (Explicit)
interface Order {
  id: string;
  total: number;
  status: string;
}

const createOrder = builder<Order>(['id', 'total', 'status']);

const order = createOrder().withId('ORD-001').withTotal(299.99).withStatus('pending').build();

console.log('Order:', order);

// Example 4: Async Validation
const createUserAsync = builderAsync(UserSchema);

async function createUserWithAsyncValidation() {
  const user = await createUserAsync()
    .withId(2)
    .withName('Jane Doe')
    .withEmail('jane@example.com')
    .withAge(25)
    .withIsActive(true)
    .build();

  console.log('Async User:', user);
}

createUserWithAsyncValidation().catch(console.error);
