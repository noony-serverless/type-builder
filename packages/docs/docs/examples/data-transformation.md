# Data Transformation Examples

Real-world examples of using Interface builders for high-performance data transformation.

## Database to API DTOs

### Basic Transformation

```typescript
import builder from '@ultra-fast-builder/core';

// Database entity (snake_case, internal fields)
interface UserEntity {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

// API DTO (camelCase, public fields only)
interface UserDTO {
  id: number;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const toUserDTO = builder<UserDTO>([
  'id',
  'email',
  'name',
  'isActive',
  'createdAt',
  'lastLogin'
]);

// Transform single user
function transformUser(entity: UserEntity): UserDTO {
  return toUserDTO()
    .withId(entity.id)
    .withEmail(entity.email)
    .withName(`${entity.first_name} ${entity.last_name}`)
    .withIsActive(entity.is_active)
    .withCreatedAt(entity.created_at.toISOString())
    .withLastLogin(entity.last_login?.toISOString() || null)
    .build();
}

// Express endpoint
app.get('/api/users', async (req, res) => {
  const users = await db.users.findMany({
    where: { is_active: true }
  });

  // Transform 10,000 users in ~25ms
  const dtos = users.map(transformUser);

  res.json(dtos);
});
```

### Nested Transformations

```typescript
interface OrderEntity {
  id: string;
  user_id: number;
  order_date: Date;
  total_amount: number;
  items: OrderItemEntity[];
  shipping_address: AddressEntity;
}

interface OrderDTO {
  id: string;
  userId: number;
  orderDate: string;
  totalAmount: number;
  items: OrderItemDTO[];
  shippingAddress: AddressDTO;
}

const toOrderDTO = builder<OrderDTO>([
  'id',
  'userId',
  'orderDate',
  'totalAmount',
  'items',
  'shippingAddress'
]);

const toOrderItemDTO = builder<OrderItemDTO>([
  'productId',
  'quantity',
  'price',
  'subtotal'
]);

const toAddressDTO = builder<AddressDTO>([
  'street',
  'city',
  'state',
  'zipCode'
]);

function transformOrder(entity: OrderEntity): OrderDTO {
  return toOrderDTO()
    .withId(entity.id)
    .withUserId(entity.user_id)
    .withOrderDate(entity.order_date.toISOString())
    .withTotalAmount(entity.total_amount)
    .withItems(entity.items.map(item =>
      toOrderItemDTO()
        .withProductId(item.product_id)
        .withQuantity(item.quantity)
        .withPrice(item.price)
        .withSubtotal(item.quantity * item.price)
        .build()
    ))
    .withShippingAddress(toAddressDTO()
      .withStreet(entity.shipping_address.street)
      .withCity(entity.shipping_address.city)
      .withState(entity.shipping_address.state)
      .withZipCode(entity.shipping_address.zip_code)
      .build()
    )
    .build();
}
```

## GraphQL Resolvers

### Type Transformation

```typescript
// Database types
interface PostEntity {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: Date;
  updated_at: Date;
}

interface UserEntity {
  id: string;
  username: string;
  email: string;
}

// GraphQL types
interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
}

const toPost = builder<Post>([
  'id',
  'title',
  'content',
  'excerpt',
  'createdAt',
  'updatedAt'
]);

const toUser = builder<User>(['id', 'username']);

const resolvers = {
  Query: {
    posts: async () => {
      const posts = await db.posts.findMany();

      return posts.map(post =>
        toPost()
          .withId(post.id)
          .withTitle(post.title)
          .withContent(post.content)
          .withExcerpt(post.content.substring(0, 150) + '...')
          .withCreatedAt(post.created_at.toISOString())
          .withUpdatedAt(post.updated_at.toISOString())
          .build()
      );
    },

    user: async (_, { id }) => {
      const user = await db.users.findUnique({ where: { id } });

      return toUser()
        .withId(user.id)
        .withUsername(user.username)
        .build();
    }
  },

  Post: {
    author: async (post) => {
      const user = await db.users.findUnique({
        where: { id: post.authorId }
      });

      return toUser()
        .withId(user.id)
        .withUsername(user.username)
        .build();
    }
  }
};
```

## Aggregation and Reporting

### Analytics Dashboard

```typescript
interface SaleRecord {
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  sale_date: Date;
  customer_id: string;
}

interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: ProductSale[];
  salesByDay: DailySale[];
}

const toSalesSummary = builder<SalesSummary>([
  'totalOrders',
  'totalRevenue',
  'averageOrderValue',
  'topProducts',
  'salesByDay'
]);

const toProductSale = builder<ProductSale>(['productId', 'quantity', 'revenue']);
const toDailySale = builder<DailySale>(['date', 'orders', 'revenue']);

function aggregateSales(records: SaleRecord[]): SalesSummary {
  const totalOrders = records.length;
  const totalRevenue = records.reduce((sum, r) => sum + (r.price * r.quantity), 0);
  const averageOrderValue = totalRevenue / totalOrders;

  // Group by product
  const productSales = records.reduce((acc, r) => {
    if (!acc[r.product_id]) {
      acc[r.product_id] = { quantity: 0, revenue: 0 };
    }
    acc[r.product_id].quantity += r.quantity;
    acc[r.product_id].revenue += r.price * r.quantity;
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const topProducts = Object.entries(productSales)
    .map(([productId, data]) =>
      toProductSale()
        .withProductId(productId)
        .withQuantity(data.quantity)
        .withRevenue(data.revenue)
        .build()
    )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Group by day
  const dailySales = records.reduce((acc, r) => {
    const date = r.sale_date.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { orders: 0, revenue: 0 };
    }
    acc[date].orders++;
    acc[date].revenue += r.price * r.quantity;
    return acc;
  }, {} as Record<string, { orders: number; revenue: number }>);

  const salesByDay = Object.entries(dailySales)
    .map(([date, data]) =>
      toDailySale()
        .withDate(date)
        .withOrders(data.orders)
        .withRevenue(data.revenue)
        .build()
    );

  return toSalesSummary()
    .withTotalOrders(totalOrders)
    .withTotalRevenue(totalRevenue)
    .withAverageOrderValue(averageOrderValue)
    .withTopProducts(topProducts)
    .withSalesByDay(salesByDay)
    .build();
}

app.get('/api/analytics/sales', async (req, res) => {
  const records = await db.sales.findMany({
    where: {
      sale_date: {
        gte: new Date(req.query.startDate as string),
        lte: new Date(req.query.endDate as string)
      }
    }
  });

  const summary = aggregateSales(records);
  res.json(summary);
});
```

## File Import/Export

### CSV to JSON

```typescript
import { parse } from 'csv-parse/sync';

interface CSVRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    full: string;
    city: string | null;
    state: string | null;
  };
}

const toContact = builder<Contact>(['id', 'name', 'email', 'phone', 'address']);

function parseAddress(fullAddress: string) {
  const parts = fullAddress.split(',').map(p => p.trim());
  return {
    full: fullAddress,
    city: parts[parts.length - 2] || null,
    state: parts[parts.length - 1] || null
  };
}

app.post('/api/contacts/import', async (req, res) => {
  const csvData = req.body.csv;
  const rows: CSVRow[] = parse(csvData, { columns: true });

  const contacts = rows.map(row =>
    toContact()
      .withId(row.id)
      .withName(row.name)
      .withEmail(row.email)
      .withPhone(row.phone)
      .withAddress(parseAddress(row.address))
      .build()
  );

  await db.contacts.createMany(contacts);
  res.json({ imported: contacts.length });
});
```

### JSON to XML

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface XMLProduct {
  id: string;
  name: string;
  price: string; // XML uses strings
  category: string;
  priceFormatted: string;
}

const toXMLProduct = builder<XMLProduct>([
  'id',
  'name',
  'price',
  'category',
  'priceFormatted'
]);

function toXML(products: Product[]): string {
  const xmlProducts = products.map(p =>
    toXMLProduct()
      .withId(p.id)
      .withName(p.name)
      .withPrice(p.price.toString())
      .withCategory(p.category)
      .withPriceFormatted(`$${p.price.toFixed(2)}`)
      .build()
  );

  return `<?xml version="1.0"?>
<products>
${xmlProducts.map(p => `
  <product>
    <id>${p.id}</id>
    <name>${p.name}</name>
    <price>${p.price}</price>
    <category>${p.category}</category>
  </product>
`).join('')}
</products>`;
}
```

## Cache Layer Transformation

### Redis Cache

```typescript
interface UserEntity {
  id: number;
  username: string;
  email: string;
  profile: {
    bio: string;
    avatar: string;
  };
  settings: Record<string, any>;
  last_login: Date;
}

interface CachedUser {
  id: number;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  lastLogin: number; // Unix timestamp for Redis
}

const toCachedUser = builder<CachedUser>([
  'id',
  'username',
  'email',
  'bio',
  'avatar',
  'lastLogin'
]);

const fromCachedUser = builder<UserEntity>([
  'id',
  'username',
  'email',
  'profile',
  'settings',
  'last_login'
]);

async function getUserWithCache(userId: number): Promise<UserEntity> {
  // Try cache first
  const cached = await redis.get(`user:${userId}`);

  if (cached) {
    const data: CachedUser = JSON.parse(cached);

    return fromCachedUser()
      .withId(data.id)
      .withUsername(data.username)
      .withEmail(data.email)
      .withProfile({ bio: data.bio, avatar: data.avatar })
      .withSettings({})
      .withLast_login(new Date(data.lastLogin * 1000))
      .build();
  }

  // Cache miss - fetch from DB
  const user = await db.users.findUnique({ where: { id: userId } });

  // Transform and cache
  const cached = toCachedUser()
    .withId(user.id)
    .withUsername(user.username)
    .withEmail(user.email)
    .withBio(user.profile.bio)
    .withAvatar(user.profile.avatar)
    .withLastLogin(Math.floor(user.last_login.getTime() / 1000))
    .build();

  await redis.set(`user:${userId}`, JSON.stringify(cachedData), 'EX', 3600);

  return user;
}
```

## Batch Processing

### ETL Pipeline

```typescript
interface RawEvent {
  timestamp: string;
  user_id: string;
  event_type: string;
  properties: Record<string, any>;
}

interface ProcessedEvent {
  id: string;
  userId: string;
  eventType: string;
  timestamp: Date;
  hour: number;
  dayOfWeek: number;
  metadata: {
    userAgent: string;
    ip: string;
  };
}

const toProcessedEvent = builder<ProcessedEvent>([
  'id',
  'userId',
  'eventType',
  'timestamp',
  'hour',
  'dayOfWeek',
  'metadata'
]);

async function processEventBatch(events: RawEvent[], batchSize: number = 1000) {
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    const processed = batch.map(event => {
      const timestamp = new Date(event.timestamp);

      return toProcessedEvent()
        .withId(generateId())
        .withUserId(event.user_id)
        .withEventType(event.event_type)
        .withTimestamp(timestamp)
        .withHour(timestamp.getHours())
        .withDayOfWeek(timestamp.getDay())
        .withMetadata({
          userAgent: event.properties.userAgent,
          ip: event.properties.ip
        })
        .build();
    });

    await db.events.createMany(processed);
    console.log(`Processed batch ${i / batchSize + 1}: ${processed.length} events`);
  }
}
```

## Next Steps

- [API Validation](./api-validation.md) - Validation examples
- [Domain Models](./domain-models.md) - Class-based examples
- [Interface Builder Guide](../guides/interface-builder.md) - Learn more about interface mode
