/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Optics Examples (Lenses and Prisms)
 * Demonstrates functional nested updates
 */

import {
  lens,
  prop,
  composeLenses,
  over,
  set as setLens,
  Lens,
  prism,
  prismType,
  prismProp,
  prismJson,
  Prism,
} from '../optics';
import { Maybe } from '../monads';

/**
 * Example 1: Basic Lens Usage
 */
export function example1_BasicLens() {
  console.log('\n=== Example 1: Basic Lens ===\n');

  interface User {
    name: string;
    age: number;
  }

  // Create lenses
  const nameLens = prop<User, 'name'>('name');
  const ageLens = prop<User, 'age'>('age');

  const user: User = { name: 'Alice', age: 30 };

  // Get
  console.log('Name:', nameLens.get(user)); // 'Alice'
  console.log('Age:', ageLens.get(user)); // 30

  // Set (returns new object)
  const updated = nameLens.set(user, 'Bob');
  console.log('Updated user:', updated); // { name: 'Bob', age: 30 }
  console.log('Original user:', user); // { name: 'Alice', age: 30 } (unchanged)

  // Modify
  const older = ageLens.modify(user, (age) => age + 1);
  console.log('Older user:', older); // { name: 'Alice', age: 31 }
}

/**
 * Example 2: Nested Lens Composition
 */
export function example2_NestedLens() {
  console.log('\n=== Example 2: Nested Lens ===\n');

  interface Address {
    street: string;
    city: string;
    zipCode: string;
  }

  interface User {
    name: string;
    address: Address;
  }

  // Create lenses for each level
  const addressLens = prop<User, 'address'>('address');
  const cityLens = prop<Address, 'city'>('city');

  // Compose to access nested property
  const userCityLens = composeLenses(addressLens, cityLens);

  const user: User = {
    name: 'Alice',
    address: {
      street: '123 Main St',
      city: 'NYC',
      zipCode: '10001',
    },
  };

  // Get nested value
  console.log('City:', userCityLens.get(user)); // 'NYC'

  // Update nested value (immutable)
  const moved = userCityLens.set(user, 'LA');
  console.log('After move:', moved);
  console.log('Original:', user); // Unchanged
}

/**
 * Example 3: Lens with Arrays
 */
export function example3_ArrayLens() {
  console.log('\n=== Example 3: Array Lens ===\n');

  interface User {
    name: string;
    tags: string[];
  }

  const user: User = {
    name: 'Alice',
    tags: ['developer', 'typescript', 'react'],
  };

  const tagsLens = prop<User, 'tags'>('tags');

  // Modify array
  const updated = tagsLens.modify(user, (tags) => [...tags, 'nodejs']);
  console.log('Updated tags:', updated.tags);
  console.log('Original tags:', user.tags); // Unchanged

  // Transform all tags
  const uppercased = tagsLens.modify(user, (tags) => tags.map((tag) => tag.toUpperCase()));
  console.log('Uppercased tags:', uppercased.tags);
}

/**
 * Example 4: Complex Nested Updates
 */
export function example4_ComplexNested() {
  console.log('\n=== Example 4: Complex Nested Updates ===\n');

  interface Company {
    name: string;
    address: {
      street: string;
      city: string;
      country: string;
    };
  }

  interface Employee {
    id: number;
    name: string;
    company: Company;
  }

  const employee: Employee = {
    id: 1,
    name: 'Alice',
    company: {
      name: 'TechCorp',
      address: {
        street: '123 Tech Ave',
        city: 'San Francisco',
        country: 'USA',
      },
    },
  };

  // Create lens chain
  const companyLens = prop<Employee, 'company'>('company');
  const companyAddressLens = prop<Company, 'address'>('address');
  const cityLens = prop<typeof employee.company.address, 'city'>('city');

  // Compose all the way down
  const employeeCityLens = composeLenses(companyLens, companyAddressLens, cityLens);

  // Update deeply nested property
  const relocated = employeeCityLens.set(employee, 'New York');
  console.log('Relocated city:', relocated.company.address.city);
  console.log('Original city:', employee.company.address.city); // Unchanged
}

/**
 * Example 5: Using 'over' Helper
 */
export function example5_OverHelper() {
  console.log('\n=== Example 5: Over Helper ===\n');

  interface Product {
    name: string;
    price: number;
  }

  const priceLens = prop<Product, 'price'>('price');
  const product: Product = { name: 'Laptop', price: 999 };

  // Apply discount using 'over'
  const discounted = over(priceLens, (price) => price * 0.8, product);
  console.log('Discounted price:', discounted.price);

  // Double the price
  const doubled = over(priceLens, (price) => price * 2, product);
  console.log('Doubled price:', doubled.price);
}

/**
 * Example 6: Prism - Discriminated Unions
 */
export function example6_PrismUnions() {
  console.log('\n=== Example 6: Prism with Unions ===\n');

  type Shape =
    | { type: 'circle'; radius: number }
    | { type: 'square'; size: number }
    | { type: 'rectangle'; width: number; height: number };

  // Create prisms for each variant
  const circlePrism = prismType<Shape, 'circle'>('circle');
  const squarePrism = prismType<Shape, 'square'>('square');

  const circle: Shape = { type: 'circle', radius: 5 };
  const square: Shape = { type: 'square', size: 10 };

  // Get from matching variant
  const circleData = circlePrism.getMaybe(circle);
  console.log('Circle data:', circleData.getOrElse({} as any));

  // Try to get from non-matching variant
  const noCircle = circlePrism.getMaybe(square);
  console.log('Circle from square:', noCircle.isSome() ? 'Found' : 'Not found');

  // Modify matching variant
  const biggerCircle = circlePrism.modify(circle, (c) => ({
    ...c,
    radius: c.radius * 2,
  }));
  console.log('Bigger circle:', biggerCircle);

  // Modify doesn't affect non-matching
  const unchangedSquare = circlePrism.modify(square, (c) => ({
    ...c,
    radius: c.radius * 2,
  }));
  console.log('Square unchanged:', unchangedSquare);
}

/**
 * Example 7: Prism - Optional Properties
 */
export function example7_PrismOptional() {
  console.log('\n=== Example 7: Prism Optional Props ===\n');

  interface User {
    name: string;
    email?: string;
    phone?: string;
  }

  const emailPrism = prismProp<User, 'email'>('email');

  const user1: User = { name: 'Alice', email: 'alice@example.com' };
  const user2: User = { name: 'Bob' };

  // Get optional property
  const email1 = emailPrism.getMaybe(user1);
  console.log('Alice email:', email1.getOrElse('No email'));

  const email2 = emailPrism.getMaybe(user2);
  console.log('Bob email:', email2.getOrElse('No email'));

  // Set optional property
  const user2WithEmail = emailPrism.set(user2, 'bob@example.com');
  console.log('Bob with email:', user2WithEmail);
}

/**
 * Example 8: Prism - JSON Parsing
 */
export function example8_PrismJson() {
  console.log('\n=== Example 8: Prism JSON Parsing ===\n');

  interface User {
    name: string;
    age: number;
  }

  const userJsonPrism = prismJson<User>();

  // Valid JSON
  const validJson = '{"name":"Alice","age":30}';
  const user1 = userJsonPrism.getMaybe(validJson);
  console.log(
    'Valid JSON:',
    user1.fold(
      () => 'Parse failed',
      (user) => `Parsed: ${user.name}, ${user.age}`
    )
  );

  // Invalid JSON
  const invalidJson = '{invalid json}';
  const user2 = userJsonPrism.getMaybe(invalidJson);
  console.log(
    'Invalid JSON:',
    user2.fold(
      () => 'Parse failed',
      (user) => `Parsed: ${user.name}, ${user.age}`
    )
  );

  // Reverse: stringify
  const user: User = { name: 'Bob', age: 25 };
  const json = userJsonPrism.reverseGetValue(user);
  console.log('Stringified:', json);
}

/**
 * Example 9: Combining Lens and Prism
 */
export function example9_LensPrismCombo() {
  console.log('\n=== Example 9: Lens + Prism ===\n');

  interface Company {
    name: string;
    ceo?: string;
  }

  interface User {
    name: string;
    company?: Company;
  }

  // Lens for company
  const companyLens = lens<User, Company | undefined>(
    (user) => user.company,
    (user, company) => ({ ...user, company })
  );

  // Prism for optional CEO
  const ceoPrism = prismProp<Company, 'ceo'>('ceo');

  const user1: User = {
    name: 'Alice',
    company: {
      name: 'TechCorp',
      ceo: 'John Doe',
    },
  };

  const user2: User = {
    name: 'Bob',
    company: {
      name: 'StartupInc',
    },
  };

  // Access CEO through lens + prism
  const ceo1 = companyLens.get(user1);
  const ceoName1 = ceo1 ? ceoPrism.getMaybe(ceo1).getOrElse('No CEO') : 'No company';
  console.log('Alice company CEO:', ceoName1);

  const ceo2 = companyLens.get(user2);
  const ceoName2 = ceo2 ? ceoPrism.getMaybe(ceo2).getOrElse('No CEO') : 'No company';
  console.log('Bob company CEO:', ceoName2);
}

/**
 * Example 10: Real-World State Updates
 */
export function example10_StateUpdates() {
  console.log('\n=== Example 10: Real-World State ===\n');

  interface Todo {
    id: number;
    text: string;
    completed: boolean;
  }

  interface AppState {
    user: {
      name: string;
      settings: {
        theme: 'light' | 'dark';
        notifications: boolean;
      };
    };
    todos: Todo[];
  }

  const state: AppState = {
    user: {
      name: 'Alice',
      settings: {
        theme: 'light',
        notifications: true,
      },
    },
    todos: [
      { id: 1, text: 'Learn lenses', completed: false },
      { id: 2, text: 'Build app', completed: false },
    ],
  };

  // Create lenses for nested state
  const userLens = prop<AppState, 'user'>('user');
  const settingsLens = prop<typeof state.user, 'settings'>('settings');
  const themeLens = prop<typeof state.user.settings, 'theme'>('theme');

  // Compose to access deeply nested theme
  const themeSettingLens = composeLenses(userLens, settingsLens, themeLens);

  // Toggle theme
  const toggleTheme = (state: AppState): AppState => {
    return themeSettingLens.modify(state, (theme) => (theme === 'light' ? 'dark' : 'light'));
  };

  const darkState = toggleTheme(state);
  console.log('Theme:', darkState.user.settings.theme);

  // Update todos
  const todosLens = prop<AppState, 'todos'>('todos');
  const completedState = todosLens.modify(state, (todos) =>
    todos.map((todo) => (todo.id === 1 ? { ...todo, completed: true } : todo))
  );

  console.log('First todo completed:', completedState.todos[0].completed);
  console.log('Original state unchanged:', state.todos[0].completed);
}

/**
 * Example 11: Form State Management
 */
export function example11_FormState() {
  console.log('\n=== Example 11: Form State ===\n');

  interface FormState {
    values: {
      username: string;
      email: string;
      age: number;
    };
    errors: {
      username?: string;
      email?: string;
      age?: string;
    };
    touched: {
      username: boolean;
      email: boolean;
      age: boolean;
    };
  }

  const initialState: FormState = {
    values: {
      username: '',
      email: '',
      age: 0,
    },
    errors: {},
    touched: {
      username: false,
      email: false,
      age: false,
    },
  };

  // Create lenses
  const valuesLens = prop<FormState, 'values'>('values');
  const errorsLens = prop<FormState, 'errors'>('errors');
  const touchedLens = prop<FormState, 'touched'>('touched');

  // Update username
  const usernameLens = prop<typeof initialState.values, 'username'>('username');
  const formValueUsernameLens = composeLenses(valuesLens, usernameLens);

  const withUsername = formValueUsernameLens.set(initialState, 'alice123');
  console.log('Username set:', withUsername.values.username);

  // Set field touched
  const touchedUsernameLens = composeLenses(
    touchedLens,
    prop<typeof initialState.touched, 'username'>('username')
  );

  const touchedState = touchedUsernameLens.set(withUsername, true);
  console.log('Username touched:', touchedState.touched.username);

  // Add error
  const withError = errorsLens.modify(touchedState, (errors) => ({
    ...errors,
    username: 'Username already taken',
  }));

  console.log('Form state:', {
    username: withError.values.username,
    touched: withError.touched.username,
    error: withError.errors.username,
  });
}

// Run all examples
export function runAllOpticsExamples() {
  example1_BasicLens();
  example2_NestedLens();
  example3_ArrayLens();
  example4_ComplexNested();
  example5_OverHelper();
  example6_PrismUnions();
  example7_PrismOptional();
  example8_PrismJson();
  example9_LensPrismCombo();
  example10_StateUpdates();
  example11_FormState();
}

// Uncomment to run
// runAllOpticsExamples();
