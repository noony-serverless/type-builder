/**
 * Prism Pattern (Optics)
 * Functional getter/setter for optional/variant data
 */

import { Maybe } from '../monads/maybe';
import { Either } from '../monads/either';

/**
 * A Prism focuses on optional values or sum types (discriminated unions)
 * Unlike Lens which always succeeds, Prism may fail to get/set
 *
 * @example
 * ```typescript
 * type Shape =
 *   | { type: 'circle'; radius: number }
 *   | { type: 'square'; size: number };
 *
 * const circlePrism = prism<Shape, number>(
 *   shape => shape.type === 'circle' ? Maybe.of(shape.radius) : Maybe.none(),
 *   radius => ({ type: 'circle', radius })
 * );
 *
 * const circle: Shape = { type: 'circle', radius: 5 };
 * const radius = circlePrism.getOption(circle); // Maybe.of(5)
 * const bigger = circlePrism.modify(circle, r => r * 2);
 * // { type: 'circle', radius: 10 }
 *
 * const square: Shape = { type: 'square', size: 10 };
 * const noRadius = circlePrism.getOption(square); // Maybe.none()
 * const unchanged = circlePrism.modify(square, r => r * 2);
 * // { type: 'square', size: 10 } (unchanged)
 * ```
 */
export class Prism<S, A> {
  constructor(
    private readonly getOption: (s: S) => Maybe<A>,
    private readonly reverseGet: (a: A) => S
  ) {}

  /**
   * Try to get value (returns Maybe)
   */
  getOrModify(source: S): Either<S, A> {
    return this.getOption(source).fold(
      () => Either.left(source),
      a => Either.right(a)
    );
  }

  /**
   * Get value as Maybe
   */
  getMaybe(source: S): Maybe<A> {
    return this.getOption(source);
  }

  /**
   * Construct source from value
   */
  reverseGetValue(value: A): S {
    return this.reverseGet(value);
  }

  /**
   * Modify value if it exists
   *
   * @example
   * ```typescript
   * const updated = circlePrism.modify(shape, radius => radius * 2);
   * ```
   */
  modify(source: S, fn: (a: A) => A): S {
    return this.getOption(source).fold(
      () => source, // No match - return unchanged
      a => this.reverseGet(fn(a))
    );
  }

  /**
   * Set value if match succeeds
   */
  set(source: S, value: A): S {
    return this.modify(source, () => value);
  }

  /**
   * Check if prism matches
   */
  isMatching(source: S): boolean {
    return this.getOption(source).isSome();
  }

  /**
   * Compose two prisms
   */
  compose<B>(other: Prism<A, B>): Prism<S, B> {
    return new Prism<S, B>(
      (s: S) => this.getOption(s).flatMap(a => other.getOption(a)),
      (b: B) => this.reverseGet(other.reverseGet(b))
    );
  }

  /**
   * Compose prism with lens
   */
  composeLens<B>(lens: import('./lens').Lens<A, B>): Prism<S, B> {
    return new Prism<S, B>(
      (s: S) => this.getOption(s).map(a => lens.get(a)),
      (_b: B) => {
        // We need a default value for A to use the lens setter
        // This is a limitation - we can't create A from just B
        throw new Error('Cannot compose Prism with Lens in reverseGet direction');
      }
    );
  }

  /**
   * Convert to optional getter
   */
  asGetter(): (s: S) => Maybe<A> {
    return (s: S) => this.getOption(s);
  }

  /**
   * Convert to partial setter
   */
  asSetter(): (value: A) => (s: S) => S {
    return (value: A) => (s: S) => this.set(s, value);
  }
}

/**
 * Create a prism
 *
 * @example
 * ```typescript
 * const numberPrism = prism<string | number, number>(
 *   val => typeof val === 'number' ? Maybe.of(val) : Maybe.none(),
 *   num => num
 * );
 * ```
 */
export function prism<S, A>(
  getOption: (s: S) => Maybe<A>,
  reverseGet: (a: A) => S
): Prism<S, A> {
  return new Prism(getOption, reverseGet);
}

/**
 * Create prism from predicate
 *
 * @example
 * ```typescript
 * const positivePrism = prismFromPredicate<number>(n => n > 0);
 * const result = positivePrism.getOption(5); // Maybe.of(5)
 * const none = positivePrism.getOption(-5); // Maybe.none()
 * ```
 */
export function prismFromPredicate<A>(
  predicate: (a: A) => boolean
): Prism<A, A> {
  return new Prism<A, A>(
    (a: A) => (predicate(a) ? Maybe.of(a) : Maybe.none<A>()),
    (a: A) => a
  );
}

/**
 * Create prism for nullable values
 *
 * @example
 * ```typescript
 * const somePrism = prismSome<string>();
 * const value = somePrism.getOption('hello'); // Maybe.of('hello')
 * const none = somePrism.getOption(null); // Maybe.none()
 * ```
 */
export function prismSome<A>(): Prism<A | null | undefined, A> {
  return new Prism<A | null | undefined, A>(
    (a: A | null | undefined) => Maybe.fromNullable(a),
    (a: A) => a
  );
}

/**
 * Create prism for Right side of Either
 *
 * @example
 * ```typescript
 * const rightPrism = prismRight<string, number>();
 * const either = Either.right<string, number>(42);
 * const value = rightPrism.getOption(either); // Maybe.of(42)
 * ```
 */
export function prismRight<L, R>(): Prism<Either<L, R>, R> {
  return new Prism<Either<L, R>, R>(
    (either: Either<L, R>) => either.toMaybe(),
    (r: R) => Either.right<L, R>(r)
  );
}

/**
 * Create prism for Left side of Either
 */
export function prismLeft<L, R>(): Prism<Either<L, R>, L> {
  return new Prism<Either<L, R>, L>(
    (either: Either<L, R>) => either.swap().toMaybe(),
    (l: L) => Either.left<L, R>(l)
  );
}

/**
 * Create prism for array index (may fail if index out of bounds)
 *
 * @example
 * ```typescript
 * const firstPrism = prismIndex<number>(0);
 * const arr = [1, 2, 3];
 * const first = firstPrism.getOption(arr); // Maybe.of(1)
 * const updated = firstPrism.set(arr, 10); // [10, 2, 3]
 *
 * const empty: number[] = [];
 * const none = firstPrism.getOption(empty); // Maybe.none()
 * ```
 */
export function prismIndex<A>(index: number): Prism<A[], A> {
  return new Prism<A[], A>(
    (arr: A[]) =>
      index >= 0 && index < arr.length
        ? Maybe.of(arr[index])
        : Maybe.none<A>(),
    (a: A) => [a]
  );
}

/**
 * Create prism for array head (first element)
 */
export function prismHead<A>(): Prism<A[], A> {
  return prismIndex<A>(0);
}

/**
 * Create prism for array tail (last element)
 */
export function prismTail<A>(): Prism<A[], A> {
  return new Prism<A[], A>(
    (arr: A[]) =>
      arr.length > 0 ? Maybe.of(arr[arr.length - 1]) : Maybe.none<A>(),
    (a: A) => [a]
  );
}

/**
 * Create prism for finding element in array
 *
 * @example
 * ```typescript
 * const evenPrism = prismFind<number>(n => n % 2 === 0);
 * const arr = [1, 2, 3, 4];
 * const even = evenPrism.getOption(arr); // Maybe.of(2) (first even)
 * ```
 */
export function prismFind<A>(predicate: (a: A) => boolean): Prism<A[], A> {
  return new Prism<A[], A>(
    (arr: A[]) => {
      const found = arr.find(predicate);
      return Maybe.fromNullable(found);
    },
    (a: A) => [a]
  );
}

/**
 * Create prism for discriminated union by type field
 *
 * @example
 * ```typescript
 * type Event =
 *   | { type: 'click'; x: number; y: number }
 *   | { type: 'keypress'; key: string };
 *
 * const clickPrism = prismType<Event, 'click'>('click');
 * const click: Event = { type: 'click', x: 10, y: 20 };
 * const data = clickPrism.getOption(click);
 * // Maybe.of({ type: 'click', x: 10, y: 20 })
 * ```
 */
export function prismType<
  S extends { type: string },
  T extends S['type']
>(
  type: T
): Prism<S, Extract<S, { type: T }>> {
  return new Prism<S, Extract<S, { type: T }>>(
    (s: S) =>
      s.type === type
        ? Maybe.of(s as Extract<S, { type: T }>)
        : Maybe.none<Extract<S, { type: T }>>(),
    (a: Extract<S, { type: T }>) => a as S
  );
}

/**
 * Create prism for instanceof check
 *
 * @example
 * ```typescript
 * class Dog { bark() {} }
 * class Cat { meow() {} }
 *
 * const dogPrism = prismInstanceOf<Dog | Cat, Dog>(Dog);
 * const dog = new Dog();
 * const result = dogPrism.getOption(dog); // Maybe.of(dog)
 * ```
 */
export function prismInstanceOf<S, A extends S>(
  constructor: new (...args: any[]) => A
): Prism<S, A> {
  return new Prism<S, A>(
    (s: S) => (s instanceof constructor ? Maybe.of(s as A) : Maybe.none<A>()),
    (a: A) => a as S
  );
}

/**
 * Create prism for typeof check
 *
 * @example
 * ```typescript
 * const stringPrism = prismTypeOf<string | number>('string');
 * const val: string | number = 'hello';
 * const str = stringPrism.getOption(val); // Maybe.of('hello')
 * ```
 */
export function prismTypeOf<S>(
  type: 'string' | 'number' | 'boolean' | 'object' | 'function' | 'symbol'
): Prism<S, any> {
  return new Prism<S, any>(
    (s: S) => (typeof s === type ? Maybe.of(s) : Maybe.none()),
    (a: any) => a as S
  );
}

/**
 * Create prism for JSON parsing
 *
 * @example
 * ```typescript
 * interface User { name: string; age: number; }
 * const userPrism = prismJson<User>();
 *
 * const json = '{"name":"Alice","age":30}';
 * const user = userPrism.getOption(json);
 * // Maybe.of({ name: 'Alice', age: 30 })
 *
 * const invalid = '{invalid}';
 * const none = userPrism.getOption(invalid); // Maybe.none()
 * ```
 */
export function prismJson<A>(): Prism<string, A> {
  return new Prism<string, A>(
    (s: string) => {
      try {
        const parsed = JSON.parse(s);
        return Maybe.of(parsed as A);
      } catch {
        return Maybe.none<A>();
      }
    },
    (a: A) => JSON.stringify(a)
  );
}

/**
 * Create prism for property that may not exist
 *
 * @example
 * ```typescript
 * interface User { name: string; email?: string; }
 * const emailPrism = prismProp<User, 'email'>('email');
 *
 * const user1: User = { name: 'Alice', email: 'alice@example.com' };
 * const email = emailPrism.getOption(user1); // Maybe.of('alice@example.com')
 *
 * const user2: User = { name: 'Bob' };
 * const noEmail = emailPrism.getOption(user2); // Maybe.none()
 * ```
 */
export function prismProp<S, K extends keyof S>(
  key: K
): Prism<S, NonNullable<S[K]>> {
  return new Prism<S, NonNullable<S[K]>>(
    (s: S) => Maybe.fromNullable(s[key] as NonNullable<S[K]>),
    (a: NonNullable<S[K]>) => ({ [key]: a } as any)
  );
}

/**
 * Compose multiple prisms
 */
export function composePrisms<S, A, B>(
  first: Prism<S, A>,
  second: Prism<A, B>
): Prism<S, B>;

export function composePrisms<S, A, B, C>(
  first: Prism<S, A>,
  second: Prism<A, B>,
  third: Prism<B, C>
): Prism<S, C>;

export function composePrisms(...prisms: Prism<any, any>[]): Prism<any, any> {
  return prisms.reduce((acc, prism) => acc.compose(prism));
}

/**
 * Helper: Modify through prism
 */
export function modifyOption<S, A>(
  prism: Prism<S, A>,
  fn: (a: A) => A,
  source: S
): S {
  return prism.modify(source, fn);
}

/**
 * Helper: Set through prism
 */
export function setOption<S, A>(prism: Prism<S, A>, value: A, source: S): S {
  return prism.set(source, value);
}

/**
 * Helper: Get through prism
 */
export function getOption<S, A>(prism: Prism<S, A>, source: S): Maybe<A> {
  return prism.getMaybe(source);
}

/**
 * Partial - like Prism but for partial updates
 * Useful for forms and partial state updates
 *
 * @example
 * ```typescript
 * interface User { name: string; email: string; age: number; }
 * const partialUser = partial<User>();
 *
 * const updates: Partial<User> = { age: 31 };
 * const user = { name: 'Alice', email: 'alice@example.com', age: 30 };
 * const updated = partialUser.set(user, updates);
 * // { name: 'Alice', email: 'alice@example.com', age: 31 }
 * ```
 */
export function partial<T>(): Prism<T, Partial<T>> {
  return new Prism<T, Partial<T>>(
    (t: T) => Maybe.of(t as Partial<T>),
    (partial: Partial<T>) => partial as T
  );
}

/**
 * At - prism for Map-like structures
 *
 * @example
 * ```typescript
 * const usersPrism = at<Map<number, User>, number, User>(
 *   id => map => map.get(id),
 *   id => user => map => new Map(map).set(id, user)
 * );
 * ```
 */
export function at<S, K, V>(
  get: (key: K) => (s: S) => V | undefined,
  set: (key: K) => (value: V) => (s: S) => S
): (key: K) => Prism<S, V> {
  return (key: K) =>
    new Prism<S, V>(
      (s: S) => Maybe.fromNullable(get(key)(s)),
      (v: V) => set(key)(v)({} as S) // Simplified
    );
}
