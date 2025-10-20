# Domain Models Examples

Real-world examples of using Class builders for domain-driven design.

## E-commerce Domain

### Order Aggregate

```typescript
import builder from '@ultra-fast-builder/core';

class Order {
  id!: string;
  customerId!: string;
  items!: OrderItem[];
  status!: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total!: number;
  shippingAddress!: Address;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(data: Partial<Order>) {
    Object.assign(this, data);
    this.status = this.status || 'pending';
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }

  // Business logic
  canBeCancelled(): boolean {
    return ['pending', 'processing'].includes(this.status);
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error(`Cannot cancel order with status: ${this.status}`);
    }
    this.status = 'cancelled';
    this.updatedAt = new Date();
  }

  calculateTotal(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal(), 0);
  }

  addItem(item: OrderItem): void {
    this.items.push(item);
    this.total = this.calculateTotal();
    this.updatedAt = new Date();
  }

  removeItem(productId: string): void {
    this.items = this.items.filter(item => item.productId !== productId);
    this.total = this.calculateTotal();
    this.updatedAt = new Date();
  }

  ship(trackingNumber: string): void {
    if (this.status !== 'processing') {
      throw new Error('Order must be processing to ship');
    }
    this.status = 'shipped';
    this.updatedAt = new Date();
    // Send shipping notification
  }
}

const createOrder = builder(Order);

// Usage in service
class OrderService {
  async createOrder(customerId: string, items: OrderItem[], address: Address) {
    const order = createOrder()
      .withId(generateId())
      .withCustomerId(customerId)
      .withItems(items)
      .withShippingAddress(address)
      .withTotal(items.reduce((sum, i) => sum + i.subtotal(), 0))
      .build();

    await this.orderRepository.save(order);
    return order;
  }

  async cancelOrder(orderId: string) {
    const order = await this.orderRepository.findById(orderId);
    order.cancel(); // Business logic in domain model
    await this.orderRepository.save(order);
  }
}
```

### Product Entity

```typescript
class Product {
  id!: string;
  name!: string;
  description!: string;
  price!: number;
  stock!: number;
  category!: string;
  isActive!: boolean;

  constructor(data: Partial<Product>) {
    Object.assign(this, data);
    this.isActive = this.isActive ?? true;
    this.stock = this.stock || 0;
  }

  isInStock(): boolean {
    return this.stock > 0 && this.isActive;
  }

  canPurchase(quantity: number): boolean {
    return this.isInStock() && this.stock >= quantity;
  }

  decreaseStock(quantity: number): void {
    if (!this.canPurchase(quantity)) {
      throw new Error('Insufficient stock');
    }
    this.stock -= quantity;
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }
    this.stock += quantity;
  }

  applyDiscount(percent: number): number {
    if (percent < 0 || percent > 100) {
      throw new Error('Invalid discount percentage');
    }
    return this.price * (1 - percent / 100);
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }
}

const createProduct = builder(Product);
```

## Blog Domain

### Post Aggregate

```typescript
class BlogPost {
  id!: string;
  title!: string;
  slug!: string;
  content!: string;
  authorId!: string;
  tags!: string[];
  status!: 'draft' | 'published' | 'archived';
  publishedAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
  viewCount!: number;

  constructor(data: Partial<BlogPost>) {
    Object.assign(this, data);
    this.status = this.status || 'draft';
    this.publishedAt = this.publishedAt || null;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
    this.viewCount = this.viewCount || 0;
  }

  isDraft(): boolean {
    return this.status === 'draft';
  }

  isPublished(): boolean {
    return this.status === 'published' && this.publishedAt !== null;
  }

  publish(): void {
    if (this.isPublished()) {
      throw new Error('Post is already published');
    }
    this.status = 'published';
    this.publishedAt = new Date();
    this.updatedAt = new Date();
  }

  unpublish(): void {
    if (!this.isPublished()) {
      throw new Error('Post is not published');
    }
    this.status = 'draft';
    this.publishedAt = null;
    this.updatedAt = new Date();
  }

  archive(): void {
    this.status = 'archived';
    this.updatedAt = new Date();
  }

  hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  addTag(tag: string): void {
    if (!this.hasTag(tag)) {
      this.tags.push(tag);
      this.updatedAt = new Date();
    }
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
    this.updatedAt = new Date();
  }

  incrementViews(): void {
    this.viewCount++;
  }

  getExcerpt(maxLength: number = 150): string {
    return this.content.length > maxLength
      ? this.content.substring(0, maxLength) + '...'
      : this.content;
  }

  updateContent(title: string, content: string): void {
    this.title = title;
    this.content = content;
    this.slug = this.generateSlug(title);
    this.updatedAt = new Date();
  }

  private generateSlug(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

const createBlogPost = builder(BlogPost);

// Usage
const post = createBlogPost()
  .withId('post-001')
  .withTitle('My First Post')
  .withContent('This is great content...')
  .withAuthorId('user-123')
  .withTags(['typescript', 'coding'])
  .build();

post.publish();
post.addTag('tutorial');
post.incrementViews();
```

## Financial Domain

### Account Entity

```typescript
class Account {
  id!: string;
  userId!: string;
  balance!: number;
  currency!: string;
  type!: 'checking' | 'savings';
  isActive!: boolean;
  transactions!: Transaction[];
  createdAt!: Date;

  constructor(data: Partial<Account>) {
    Object.assign(this, data);
    this.balance = this.balance || 0;
    this.isActive = this.isActive ?? true;
    this.transactions = this.transactions || [];
    this.createdAt = this.createdAt || new Date();
  }

  canWithdraw(amount: number): boolean {
    return this.isActive && this.balance >= amount && amount > 0;
  }

  withdraw(amount: number, description: string = 'Withdrawal'): void {
    if (!this.canWithdraw(amount)) {
      throw new Error('Insufficient funds or inactive account');
    }

    this.balance -= amount;
    this.recordTransaction('debit', amount, description);
  }

  deposit(amount: number, description: string = 'Deposit'): void {
    if (!this.isActive) {
      throw new Error('Cannot deposit to inactive account');
    }
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    this.balance += amount;
    this.recordTransaction('credit', amount, description);
  }

  transfer(toAccount: Account, amount: number): void {
    if (!this.canWithdraw(amount)) {
      throw new Error('Cannot transfer: insufficient funds');
    }
    if (this.currency !== toAccount.currency) {
      throw new Error('Cannot transfer between different currencies');
    }

    this.withdraw(amount, `Transfer to ${toAccount.id}`);
    toAccount.deposit(amount, `Transfer from ${this.id}`);
  }

  freeze(): void {
    this.isActive = false;
  }

  unfreeze(): void {
    this.isActive = true;
  }

  getTransactionHistory(limit: number = 10): Transaction[] {
    return this.transactions.slice(-limit);
  }

  private recordTransaction(type: 'credit' | 'debit', amount: number, description: string): void {
    this.transactions.push({
      id: generateId(),
      type,
      amount,
      description,
      balance: this.balance,
      timestamp: new Date()
    });
  }
}

const createAccount = builder(Account);

// Usage
const checking = createAccount()
  .withId('acc-001')
  .withUserId('user-123')
  .withBalance(1000)
  .withCurrency('USD')
  .withType('checking')
  .build();

const savings = createAccount()
  .withId('acc-002')
  .withUserId('user-123')
  .withBalance(5000)
  .withCurrency('USD')
  .withType('savings')
  .build();

checking.withdraw(100, 'ATM withdrawal');
savings.deposit(500, 'Monthly savings');
checking.transfer(savings, 200);
```

## Value Objects

### Money

```typescript
class Money {
  amount!: number;
  currency!: string;

  constructor(data: Partial<Money>) {
    Object.assign(this, data);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return createMoney()
      .withAmount(this.amount + other.amount)
      .withCurrency(this.currency)
      .build();
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return createMoney()
      .withAmount(this.amount - other.amount)
      .withCurrency(this.currency)
      .build();
  }

  multiply(factor: number): Money {
    return createMoney()
      .withAmount(this.amount * factor)
      .withCurrency(this.currency)
      .build();
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return createMoney()
      .withAmount(this.amount / divisor)
      .withCurrency(this.currency)
      .build();
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.amount < other.amount;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  format(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot operate on different currencies: ${this.currency} vs ${other.currency}`);
    }
  }
}

const createMoney = builder(Money);

// Usage
const price = createMoney().withAmount(100).withCurrency('USD').build();
const tax = createMoney().withAmount(10).withCurrency('USD').build();
const total = price.add(tax);

console.log(total.format()); // "$110.00"
```

## Next Steps

- [API Validation](./api-validation.md) - Validation examples
- [Data Transformation](./data-transformation.md) - DTO examples
- [Class Builder Guide](../guides/class-builder.md) - Learn more about class mode
