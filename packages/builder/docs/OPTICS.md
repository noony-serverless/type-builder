# Optics Guide (Lenses & Prisms)

Optics provide powerful, composable tools for accessing and updating nested immutable data structures.

## Installation

```typescript
import {
  lens,
  prop,
  prism,
  prismType
} from '@noony-serverless/type-builder/optics';
```

## Table of Contents

1. [Lens Basics](#lens-basics)
2. [Composing Lenses](#composing-lenses)
3. [Prism Basics](#prism-basics)
4. [Advanced Patterns](#advanced-patterns)
5. [Real-World Examples](#real-world-examples)

---

## Lens Basics

A **Lens** is a functional getter/setter for immutable data. It focuses on a specific property and allows you to read or update it without mutation.

### Creating Lenses

```typescript
import { lens, prop } from '@noony-serverless/type-builder/optics';

interface User {
  name: string;
  age: number;
}

// Simple property lens
const nameLens = prop<User, 'name'>('name');
const ageLens = prop<User, 'age'>('age');

// Custom lens
const customLens = lens<User, string>(
  user => user.name,                    // Getter
  (user, name) => ({ ...user, name })   // Setter
);
```

### Using Lenses

```typescript
const user: User = { name: 'Alice', age: 30 };

// Get value
const name = nameLens.get(user);
// 'Alice'

// Set value (returns new object)
const updated = nameLens.set(user, 'Bob');
// { name: 'Bob', age: 30 }

console.log(user.name); // 'Alice' (original unchanged)

// Modify value
const older = ageLens.modify(user, age => age + 1);
// { name: 'Alice', age: 31 }
```

### Helper Functions

```typescript
import { over, set as setLens, view as viewLens } from '@noony-serverless/type-builder/optics';

// over: Apply function through lens
const updated = over(nameLens, name => name.toUpperCase(), user);

// set: Set value through lens
const updated2 = setLens(nameLens, 'Charlie', user);

// view: Get value through lens
const name = viewLens(nameLens, user);
```

---

## Composing Lenses

The real power of lenses comes from composition - accessing deeply nested properties.

### Nested Data

```typescript
interface Address {
  street: string;
  city: string;
  zipCode: string;
}

interface User {
  name: string;
  address: Address;
}

const user: User = {
  name: 'Alice',
  address: {
    street: '123 Main St',
    city: 'NYC',
    zipCode: '10001'
  }
};
```

### Composing Lenses

```typescript
import { composeLenses } from '@noony-serverless/type-builder/optics';

// Create lenses for each level
const addressLens = prop<User, 'address'>('address');
const cityLens = prop<Address, 'city'>('city');

// Compose to access nested property
const userCityLens = composeLenses(addressLens, cityLens);

// Use composed lens
const city = userCityLens.get(user);
// 'NYC'

const movedUser = userCityLens.set(user, 'LA');
// { name: 'Alice', address: { street: '123 Main St', city: 'LA', zipCode: '10001' } }

console.log(user.address.city); // 'NYC' (original unchanged)
```

### Deep Nesting

```typescript
interface Company {
  name: string;
  address: {
    street: string;
    city: string;
  };
}

interface Employee {
  id: number;
  company: Company;
}

// Compose multiple levels
const companyLens = prop<Employee, 'company'>('company');
const companyAddressLens = prop<Company, 'address'>('address');
const cityLens = prop<typeof employee.company.address, 'city'>('city');

const employeeCityLens = composeLenses(
  companyLens,
  companyAddressLens,
  cityLens
);

// Update deeply nested property
const relocated = employeeCityLens.set(employee, 'San Francisco');
```

---

## Prism Basics

A **Prism** is like a lens but for optional or variant data. It may fail to get/set values.

### Creating Prisms

```typescript
import { prism, prismType, prismProp } from '@noony-serverless/type-builder/optics';
import { Maybe } from '@noony-serverless/type-builder/monads';

// Discriminated union
type Shape =
  | { type: 'circle'; radius: number }
  | { type: 'square'; size: number };

// Prism for specific variant
const circlePrism = prismType<Shape, 'circle'>('circle');

const circle: Shape = { type: 'circle', radius: 5 };
const square: Shape = { type: 'square', size: 10 };
```

### Using Prisms

```typescript
// Get from matching variant
const circleData = circlePrism.getMaybe(circle);
// Maybe.of({ type: 'circle', radius: 5 })

// Try to get from non-matching variant
const noCircle = circlePrism.getMaybe(square);
// Maybe.none() (doesn't match)

// Modify matching variant
const biggerCircle = circlePrism.modify(circle, c => ({
  ...c,
  radius: c.radius * 2
}));
// { type: 'circle', radius: 10 }

// Modify non-matching (no effect)
const unchangedSquare = circlePrism.modify(square, c => ({
  ...c,
  radius: c.radius * 2
}));
// { type: 'square', size: 10 } (unchanged)
```

### Optional Properties

```typescript
interface User {
  name: string;
  email?: string;
}

const emailPrism = prismProp<User, 'email'>('email');

const user1: User = { name: 'Alice', email: 'alice@example.com' };
const user2: User = { name: 'Bob' };

// Get optional property
emailPrism.getMaybe(user1).getOrElse('No email');
// 'alice@example.com'

emailPrism.getMaybe(user2).getOrElse('No email');
// 'No email'

// Set optional property
const user2WithEmail = emailPrism.set(user2, 'bob@example.com');
// { name: 'Bob', email: 'bob@example.com' }
```

---

## Advanced Patterns

### Array Index Lens

```typescript
import { index } from '@noony-serverless/type-builder/optics';

const firstLens = index<number>(0);
const arr = [1, 2, 3];

const first = firstLens.get(arr);
// 1

const updated = firstLens.set(arr, 10);
// [10, 2, 3]
```

### Array Prism

```typescript
import { prismIndex, prismHead, prismTail } from '@noony-serverless/type-builder/optics';

const firstPrism = prismHead<number>();
const arr = [1, 2, 3];

const first = firstPrism.getMaybe(arr);
// Maybe.of(1)

const empty: number[] = [];
const noFirst = firstPrism.getMaybe(empty);
// Maybe.none()
```

### JSON Parsing

```typescript
import { prismJson } from '@noony-serverless/type-builder/optics';

interface User {
  name: string;
  age: number;
}

const userJsonPrism = prismJson<User>();

// Valid JSON
const user = userJsonPrism.getMaybe('{"name":"Alice","age":30}');
// Maybe.of({ name: 'Alice', age: 30 })

// Invalid JSON
const invalid = userJsonPrism.getMaybe('{invalid}');
// Maybe.none()

// Reverse: stringify
const json = userJsonPrism.reverseGetValue({ name: 'Bob', age: 25 });
// '{"name":"Bob","age":25}'
```

### Filtered Lens

```typescript
import { filtered } from '@noony-serverless/type-builder/optics';

const evensLens = filtered<number>(n => n % 2 === 0);
const arr = [1, 2, 3, 4, 5, 6];

// Get all evens
const evens = evensLens.get(arr);
// [2, 4, 6]

// Modify all evens
const doubled = evensLens.modify(arr, n => n * 2);
// [1, 4, 3, 8, 5, 12]
```

### View Multiple Properties

```typescript
import { view } from '@noony-serverless/type-builder/optics';

interface Point {
  x: number;
  y: number;
  z: number;
}

const coordsLens = view<Point, 'x' | 'y'>('x', 'y');
const point = { x: 10, y: 20, z: 30 };

const coords = coordsLens.get(point);
// { x: 10, y: 20 }

const updated = coordsLens.set(point, { x: 100, y: 200 });
// { x: 100, y: 200, z: 30 }
```

---

## Real-World Examples

### React State Management

```typescript
interface AppState {
  user: {
    profile: {
      name: string;
      email: string;
    };
    settings: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  };
  todos: Todo[];
}

// Create lens path to nested theme
const userLens = prop<AppState, 'user'>('user');
const settingsLens = prop<typeof state.user, 'settings'>('settings');
const themeLens = prop<typeof state.user.settings, 'theme'>('theme');

const themeSettingLens = composeLenses(userLens, settingsLens, themeLens);

// Toggle theme (immutable)
function toggleTheme(state: AppState): AppState {
  return themeSettingLens.modify(state, theme =>
    theme === 'light' ? 'dark' : 'light'
  );
}

const newState = toggleTheme(state);
```

### Form State Management

```typescript
interface FormState {
  values: {
    username: string;
    email: string;
  };
  errors: {
    username?: string;
    email?: string;
  };
  touched: {
    username: boolean;
    email: boolean;
  };
}

// Create lenses
const valuesLens = prop<FormState, 'values'>('values');
const usernameLens = prop<typeof initialState.values, 'username'>('username');

const formUsernameLens = composeLenses(valuesLens, usernameLens);

// Update username (immutable)
const withUsername = formUsernameLens.set(state, 'alice123');

// Mark field as touched
const touchedLens = prop<FormState, 'touched'>('touched');
const touchedUsernameLens = composeLenses(
  touchedLens,
  prop<typeof state.touched, 'username'>('username')
);

const touchedState = touchedUsernameLens.set(state, true);
```

### Discriminated Union Updates

```typescript
type Event =
  | { type: 'click'; x: number; y: number }
  | { type: 'keypress'; key: string }
  | { type: 'scroll'; delta: number };

const clickPrism = prismType<Event, 'click'>('click');

function doubleClickPosition(event: Event): Event {
  return clickPrism.modify(event, click => ({
    ...click,
    x: click.x * 2,
    y: click.y * 2
  }));
}

const click: Event = { type: 'click', x: 10, y: 20 };
const doubled = doubleClickPosition(click);
// { type: 'click', x: 20, y: 40 }

const keypress: Event = { type: 'keypress', key: 'a' };
const unchanged = doubleClickPosition(keypress);
// { type: 'keypress', key: 'a' } (unchanged)
```

### Combining Lens and Prism

```typescript
interface Company {
  name: string;
  ceo?: string;
}

interface User {
  name: string;
  company?: Company;
}

const companyLens = lens<User, Company | undefined>(
  user => user.company,
  (user, company) => ({ ...user, company })
);

const ceoPrism = prismProp<Company, 'ceo'>('ceo');

function getCEOName(user: User): Maybe<string> {
  const company = companyLens.get(user);
  if (!company) return Maybe.none();
  return ceoPrism.getMaybe(company);
}

const user: User = {
  name: 'Alice',
  company: { name: 'TechCorp', ceo: 'John Doe' }
};

const ceo = getCEOName(user);
// Maybe.of('John Doe')
```

---

## Performance Tips

### 1. Compose Lenses Once

```typescript
// Good: Compose once, reuse
const userCityLens = composeLenses(addressLens, cityLens);
const updated1 = userCityLens.set(state1, 'NYC');
const updated2 = userCityLens.set(state2, 'LA');

// Avoid: Recomposing every time
const updated1 = composeLenses(addressLens, cityLens).set(state1, 'NYC');
const updated2 = composeLenses(addressLens, cityLens).set(state2, 'LA');
```

### 2. Use Prisms for Optional Access

```typescript
// Good: Prism handles undefined gracefully
const emailPrism = prismProp<User, 'email'>('email');
const email = emailPrism.getMaybe(user).getOrElse('no-email');

// Avoid: Manual null checks
const email = user.email !== undefined ? user.email : 'no-email';
```

### 3. Batch Updates

```typescript
// Good: Single update
const updated = pipe<AppState>(
  themeSettingLens.toSetter()('dark'),
  notificationsLens.toSetter()(true)
)(state);

// Avoid: Multiple updates
let state2 = themeSettingLens.set(state, 'dark');
state2 = notificationsLens.set(state2, true);
```

---

## Common Patterns

### Optional Chaining

```typescript
// Without optics
const zipCode = user?.address?.zipCode ?? 'No ZIP';

// With optics (composable and reusable)
const zipCodeLens = composeLenses(
  prop<User, 'address'>('address'),
  prop<Address, 'zipCode'>('zipCode')
);
const zipCode = zipCodeLens.get(user) ?? 'No ZIP';
```

### Conditional Updates

```typescript
function updateUserCity(user: User, newCity: string): User {
  if (user.address) {
    return userCityLens.set(user, newCity);
  }
  return user;
}

// Or with prism
const addressPrism = prismProp<User, 'address'>('address');
function updateUserCity2(user: User, newCity: string): User {
  return addressPrism.modify(user, addr => ({
    ...addr,
    city: newCity
  }));
}
```

### Transformations

```typescript
// Uppercase all emails
const emailLens = prop<User, 'email'>('email');
const uppercased = emailLens.modify(user, email => email.toUpperCase());

// Apply discount to product
const priceLens = prop<Product, 'price'>('price');
const discounted = over(priceLens, price => price * 0.8, product);
```

---

## Lens vs Prism Decision Guide

| Use Lens When | Use Prism When |
|--------------|----------------|
| Property always exists | Property is optional |
| Fixed structure | Discriminated unions |
| Guaranteed access | May fail to match |
| Need to modify | Need to conditionally modify |

---

## API Reference

### Lens Methods

- `get(source)` - Get value
- `set(source, value)` - Set value (returns new object)
- `modify(source, fn)` - Apply function to value
- `compose(other)` - Compose with another lens

### Prism Methods

- `getMaybe(source)` - Get value as Maybe
- `set(source, value)` - Set if match succeeds
- `modify(source, fn)` - Modify if match succeeds
- `isMatching(source)` - Check if prism matches
- `compose(other)` - Compose with another prism

### Helper Functions

- `prop(key)` - Create property lens
- `lens(getter, setter)` - Create custom lens
- `composeLenses(...lenses)` - Compose multiple lenses
- `over(lens, fn, source)` - Apply function through lens
- `prismType(type)` - Create prism for discriminated union
- `prismProp(key)` - Create prism for optional property
- `prismJson()` - Create JSON parsing prism

## Examples

See [functional-optics.ts](../src/examples/functional-optics.ts) for comprehensive examples.

## Next Steps

- Learn about [Monads](./MONADS.md) for error handling
- Read [Functional Programming Guide](./FUNCTIONAL-PROGRAMMING.md)
- Check out [React Integration](./REACT-INTEGRATION.md)
