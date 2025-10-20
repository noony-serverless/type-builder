/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Maybe Monad
 * Handles nullable/optional values functionally
 */

/**
 * Maybe monad - represents a value that may or may not exist
 * Prevents null/undefined errors and provides safe chaining
 *
 * @example
 * ```typescript
 * function findUser(id: number): Maybe<User> {
 *   const user = database.find(id);
 *   return user ? Maybe.of(user) : Maybe.none();
 * }
 *
 * const userName = findUser(1)
 *   .map(user => user.name)
 *   .map(name => name.toUpperCase())
 *   .getOrElse('UNKNOWN');
 * ```
 */
export class Maybe<T> {
  private constructor(private readonly value: T | null | undefined) {}

  /**
   * Create a Maybe with a value
   */
  static of<T>(value: T | null | undefined): Maybe<T> {
    return new Maybe(value);
  }

  /**
   * Create an empty Maybe (None)
   */
  static none<T>(): Maybe<T> {
    return new Maybe<T>(null);
  }

  /**
   * Create Maybe from nullable value
   */
  static fromNullable<T>(value: T | null | undefined): Maybe<T> {
    return value == null ? Maybe.none<T>() : Maybe.of(value);
  }

  /**
   * Check if Maybe has a value
   */
  isSome(): boolean {
    return this.value != null;
  }

  /**
   * Check if Maybe is empty
   */
  isNone(): boolean {
    return this.value == null;
  }

  /**
   * Transform the value if it exists
   *
   * @example
   * ```typescript
   * Maybe.of(5)
   *   .map(x => x * 2)
   *   .map(x => x + 1)
   *   .getOrElse(0); // 11
   *
   * Maybe.none()
   *   .map(x => x * 2)
   *   .getOrElse(0); // 0
   * ```
   */
  map<U>(fn: (value: T) => U): Maybe<U> {
    if (this.isNone()) {
      return Maybe.none<U>();
    }
    return Maybe.of(fn(this.value!));
  }

  /**
   * Transform the value and flatten the result
   *
   * @example
   * ```typescript
   * function findById(id: number): Maybe<User> {
   *   return Maybe.fromNullable(database.find(id));
   * }
   *
   * Maybe.of(1)
   *   .flatMap(findById)
   *   .map(user => user.name)
   *   .getOrElse('Unknown');
   * ```
   */
  flatMap<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    if (this.isNone()) {
      return Maybe.none<U>();
    }
    return fn(this.value!);
  }

  /**
   * Filter based on predicate
   *
   * @example
   * ```typescript
   * Maybe.of(25)
   *   .filter(age => age >= 18)
   *   .getOrElse(0); // 25
   *
   * Maybe.of(15)
   *   .filter(age => age >= 18)
   *   .getOrElse(0); // 0
   * ```
   */
  filter(predicate: (value: T) => boolean): Maybe<T> {
    if (this.isNone() || !predicate(this.value!)) {
      return Maybe.none<T>();
    }
    return this;
  }

  /**
   * Get value or return default
   *
   * @example
   * ```typescript
   * Maybe.of('Alice').getOrElse('Unknown'); // 'Alice'
   * Maybe.none().getOrElse('Unknown'); // 'Unknown'
   * ```
   */
  getOrElse(defaultValue: T): T {
    return this.isNone() ? defaultValue : this.value!;
  }

  /**
   * Get value or compute default
   *
   * @example
   * ```typescript
   * Maybe.of(5).getOrElseGet(() => Math.random()); // 5
   * Maybe.none().getOrElseGet(() => Math.random()); // random number
   * ```
   */
  getOrElseGet(fn: () => T): T {
    return this.isNone() ? fn() : this.value!;
  }

  /**
   * Get value or throw error
   *
   * @example
   * ```typescript
   * Maybe.of(5).getOrThrow(); // 5
   * Maybe.none().getOrThrow(); // throws Error
   * ```
   */
  getOrThrow(error?: Error): T {
    if (this.isNone()) {
      throw error || new Error('Maybe.getOrThrow: value is None');
    }
    return this.value!;
  }

  /**
   * Execute side effect if value exists
   *
   * @example
   * ```typescript
   * Maybe.of(user)
   *   .forEach(u => console.log(u.name));
   * ```
   */
  forEach(fn: (value: T) => void): void {
    if (this.isSome()) {
      fn(this.value!);
    }
  }

  /**
   * Fold Maybe into a value
   *
   * @example
   * ```typescript
   * const message = Maybe.of(user).fold(
   *   () => 'No user found',
   *   user => `Hello, ${user.name}`
   * );
   * ```
   */
  fold<U>(onNone: () => U, onSome: (value: T) => U): U {
    return this.isNone() ? onNone() : onSome(this.value!);
  }

  /**
   * Convert to Either
   *
   * @example
   * ```typescript
   * Maybe.of(user)
   *   .toEither('User not found')
   *   .fold(
   *     error => console.error(error),
   *     user => console.log(user)
   *   );
   * ```
   */
  toEither<L>(left: L): import('./either').Either<L, T> {
    const { Either } = require('./either');
    return this.isNone() ? Either.left(left) : Either.right(this.value!);
  }

  /**
   * Convert to array
   *
   * @example
   * ```typescript
   * Maybe.of(5).toArray(); // [5]
   * Maybe.none().toArray(); // []
   * ```
   */
  toArray(): T[] {
    return this.isNone() ? [] : [this.value!];
  }

  /**
   * Convert to nullable value
   */
  toNullable(): T | null {
    return this.value ?? null;
  }

  /**
   * Convert to undefined value
   */
  toUndefined(): T | undefined {
    return this.value ?? undefined;
  }

  /**
   * Combine two Maybes
   *
   * @example
   * ```typescript
   * const firstName = Maybe.of('John');
   * const lastName = Maybe.of('Doe');
   *
   * const fullName = firstName.ap(
   *   lastName.map(last => (first: string) => `${first} ${last}`)
   * );
   * ```
   */
  ap<U>(fab: Maybe<(value: T) => U>): Maybe<U> {
    return fab.flatMap((fn) => this.map(fn));
  }

  /**
   * Chain multiple operations
   *
   * @example
   * ```typescript
   *   const result = Maybe.of(5)
   *   .chain(x => Maybe.of(x * 2))
   *   .chain(x => Maybe.of(x + 1));
   * ```
   */
  chain<U>(fn: (value: T) => Maybe<U>): Maybe<U> {
    return this.flatMap(fn);
  }

  /**
   * Provide alternative Maybe if this one is None
   *
   * @example
   * ```typescript
   * Maybe.none<number>()
   *   .orElse(Maybe.of(10))
   *   .getOrElse(0); // 10
   * ```
   */
  orElse(alternative: Maybe<T>): Maybe<T> {
    return this.isNone() ? alternative : this;
  }

  /**
   * Provide alternative Maybe from function if this one is None
   */
  orElseGet(fn: () => Maybe<T>): Maybe<T> {
    return this.isNone() ? fn() : this;
  }

  /**
   * Check equality with another Maybe
   */
  equals(other: Maybe<T>): boolean {
    if (this.isNone() && other.isNone()) return true;
    if (this.isNone() || other.isNone()) return false;
    return this.value === other.value;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.isNone() ? 'Maybe.None' : `Maybe.Some(${this.value})`;
  }
}

/**
 * Utility functions for Maybe
 */

/**
 * Sequence an array of Maybes into Maybe of array
 *
 * @example
 * ```typescript
 * const maybes = [Maybe.of(1), Maybe.of(2), Maybe.of(3)];
 * sequence(maybes); // Maybe.of([1, 2, 3])
 *
 * const maybesWithNone = [Maybe.of(1), Maybe.none(), Maybe.of(3)];
 * sequence(maybesWithNone); // Maybe.none()
 * ```
 */
export function sequence<T>(maybes: Maybe<T>[]): Maybe<T[]> {
  const results: T[] = [];

  for (const maybe of maybes) {
    if (maybe.isNone()) {
      return Maybe.none<T[]>();
    }
    results.push(maybe.getOrThrow());
  }

  return Maybe.of(results);
}

/**
 * Traverse an array with a Maybe-returning function
 *
 * @example
 * ```typescript
 * const numbers = [1, 2, 3];
 * traverse(numbers, n => Maybe.of(n * 2)); // Maybe.of([2, 4, 6])
 * ```
 */
export function traverse<T, U>(arr: T[], fn: (value: T) => Maybe<U>): Maybe<U[]> {
  return sequence(arr.map(fn));
}

/**
 * Lift a regular function to work with Maybe
 *
 * @example
 * ```typescript
 * const add = (a: number, b: number) => a + b;
 * const addMaybe = liftMaybe2(add);
 *
 * addMaybe(Maybe.of(5), Maybe.of(3)); // Maybe.of(8)
 * addMaybe(Maybe.of(5), Maybe.none()); // Maybe.none()
 * ```
 */
export function liftMaybe2<A, B, R>(
  fn: (a: A, b: B) => R
): (ma: Maybe<A>, mb: Maybe<B>) => Maybe<R> {
  return (ma: Maybe<A>, mb: Maybe<B>) => ma.flatMap((a) => mb.map((b) => fn(a, b)));
}

/**
 * Lift function with 3 parameters
 */
export function liftMaybe3<A, B, C, R>(
  fn: (a: A, b: B, c: C) => R
): (ma: Maybe<A>, mb: Maybe<B>, mc: Maybe<C>) => Maybe<R> {
  return (ma: Maybe<A>, mb: Maybe<B>, mc: Maybe<C>) =>
    ma.flatMap((a) => mb.flatMap((b) => mc.map((c) => fn(a, b, c))));
}

/**
 * Find first Some in array
 *
 * @example
 * ```typescript
 * const maybes = [Maybe.none(), Maybe.of(5), Maybe.of(10)];
 * firstSome(maybes); // Maybe.of(5)
 * ```
 */
export function firstSome<T>(maybes: Maybe<T>[]): Maybe<T> {
  for (const maybe of maybes) {
    if (maybe.isSome()) {
      return maybe;
    }
  }
  return Maybe.none<T>();
}

/**
 * Check if all Maybes are Some
 */
export function allSome<T>(maybes: Maybe<T>[]): boolean {
  return maybes.every((m) => m.isSome());
}

/**
 * Check if any Maybe is Some
 */
export function anySome<T>(maybes: Maybe<T>[]): boolean {
  return maybes.some((m) => m.isSome());
}
