/**
 * Lens Pattern (Optics)
 * Functional getter/setter for nested immutable updates
 */

import { BuilderState } from '../functional/types';

/**
 * A Lens is a composable getter/setter for immutable data
 *
 * @example
 * ```typescript
 * interface Address { street: string; city: string; }
 * interface User { name: string; address: Address; }
 *
 * const addressLens = lens<User, Address>(
 *   user => user.address,
 *   (user, address) => ({ ...user, address })
 * );
 *
 * const cityLens = lens<Address, string>(
 *   addr => addr.city,
 *   (addr, city) => ({ ...addr, city })
 * );
 *
 * // Compose lenses to access nested properties
 * const userCityLens = compose(addressLens, cityLens);
 *
 * const user = { name: 'Alice', address: { street: '123 Main', city: 'NYC' } };
 * const newUser = userCityLens.set(user, 'LA');
 * // { name: 'Alice', address: { street: '123 Main', city: 'LA' } }
 * ```
 */
export class Lens<S, A> {
  constructor(
    private readonly getter: (s: S) => A,
    private readonly setter: (s: S, a: A) => S
  ) {}

  /**
   * Get value from source
   */
  get(source: S): A {
    return this.getter(source);
  }

  /**
   * Set value in source (returns new object)
   */
  set(source: S, value: A): S {
    return this.setter(source, value);
  }

  /**
   * Modify value using a function
   *
   * @example
   * ```typescript
   * const nameLens = lens<User, string>(
   *   u => u.name,
   *   (u, name) => ({ ...u, name })
   * );
   *
   * const user = { name: 'alice' };
   * const updated = nameLens.modify(user, name => name.toUpperCase());
   * // { name: 'ALICE' }
   * ```
   */
  modify(source: S, fn: (a: A) => A): S {
    return this.set(source, fn(this.get(source)));
  }

  /**
   * Compose two lenses (access nested properties)
   *
   * @example
   * ```typescript
   * const addressLens = lens<User, Address>(...);
   * const cityLens = lens<Address, string>(...);
   * const userCityLens = addressLens.compose(cityLens);
   *
   * const city = userCityLens.get(user);
   * const updated = userCityLens.set(user, 'LA');
   * ```
   */
  compose<B>(other: Lens<A, B>): Lens<S, B> {
    return new Lens<S, B>(
      (s: S) => other.get(this.get(s)),
      (s: S, b: B) => this.set(s, other.set(this.get(s), b))
    );
  }

  /**
   * Map over the focused value
   */
  map<B>(fn: (a: A) => B): Lens<S, B> {
    return new Lens<S, B>(
      (s: S) => fn(this.get(s)),
      (_s: S, _b: B) => {
        // This is tricky - we can't easily reverse the mapping
        // So we keep the original setter behavior
        throw new Error('Cannot set through a mapped lens');
      }
    );
  }

  /**
   * Convert to builder setter function
   */
  toSetter(): (value: A) => (state: BuilderState<S>) => BuilderState<S> {
    return (value: A) => (state: BuilderState<S>): BuilderState<S> => {
      return Object.freeze(this.set(state as S, value) as BuilderState<S>);
    };
  }
}

/**
 * Create a lens
 *
 * @example
 * ```typescript
 * const nameLens = lens<User, string>(
 *   user => user.name,
 *   (user, name) => ({ ...user, name })
 * );
 * ```
 */
export function lens<S, A>(
  getter: (s: S) => A,
  setter: (s: S, a: A) => S
): Lens<S, A> {
  return new Lens(getter, setter);
}

/**
 * Create a lens for a specific property
 *
 * @example
 * ```typescript
 * const nameLens = prop<User, 'name'>('name');
 * const email = nameLens.get(user);
 * const updated = nameLens.set(user, 'New Name');
 * ```
 */
export function prop<S, K extends keyof S>(key: K): Lens<S, S[K]> {
  return new Lens<S, S[K]>(
    (s: S) => s[key],
    (s: S, value: S[K]) => Object.freeze({ ...s, [key]: value } as S)
  );
}

/**
 * Create a lens for nested property access
 *
 * @example
 * ```typescript
 * const cityLens = path<User>()('address')('city');
 * const city = cityLens.get(user);
 * const updated = cityLens.set(user, 'LA');
 * ```
 */
export function path<S>(): <K extends keyof S>(
  key: K
) => {
  <K2 extends keyof S[K]>(key2: K2): Lens<S, S[K][K2]>;
  (): Lens<S, S[K]>;
} {
  return <K extends keyof S>(key: K) => {
    const firstLens = prop<S, K>(key);

    const builder: any = () => firstLens;

    builder.get = <K2 extends keyof S[K]>(key2: K2): Lens<S, S[K][K2]> => {
      const secondLens = prop<S[K], K2>(key2);
      return firstLens.compose(secondLens);
    };

    // Make it callable for nested access
    return new Proxy(builder, {
      apply: (_target, _thisArg, args) => {
        if (args.length === 0) {
          return firstLens;
        }
        const key2 = args[0] as keyof S[K];
        const secondLens = prop<S[K], typeof key2>(key2);
        return firstLens.compose(secondLens);
      }
    });
  };
}

/**
 * Compose multiple lenses
 *
 * @example
 * ```typescript
 * const userCityLens = composeLenses(
 *   prop<User, 'address'>('address'),
 *   prop<Address, 'city'>('city')
 * );
 * ```
 */
export function composeLenses<S, A, B>(
  first: Lens<S, A>,
  second: Lens<A, B>
): Lens<S, B>;

export function composeLenses<S, A, B, C>(
  first: Lens<S, A>,
  second: Lens<A, B>,
  third: Lens<B, C>
): Lens<S, C>;

export function composeLenses<S, A, B, C, D>(
  first: Lens<S, A>,
  second: Lens<A, B>,
  third: Lens<B, C>,
  fourth: Lens<C, D>
): Lens<S, D>;

export function composeLenses(...lenses: Lens<any, any>[]): Lens<any, any> {
  return lenses.reduce((acc, lens) => acc.compose(lens));
}

/**
 * Create lens for array index
 *
 * @example
 * ```typescript
 * const firstLens = index<number>(0);
 * const arr = [1, 2, 3];
 * const first = firstLens.get(arr); // 1
 * const updated = firstLens.set(arr, 10); // [10, 2, 3]
 * ```
 */
export function index<A>(idx: number): Lens<A[], A> {
  return new Lens<A[], A>(
    (arr: A[]) => arr[idx]!,
    (arr: A[], value: A) => {
      const copy = [...arr];
      copy[idx] = value;
      return Object.freeze(copy) as A[];
    }
  );
}

/**
 * Create lens for array filtering
 * Updates all elements that match predicate
 *
 * @example
 * ```typescript
 * const evensLens = filtered<number>(n => n % 2 === 0);
 * const arr = [1, 2, 3, 4];
 * const updated = evensLens.modify(arr, n => n * 10);
 * // [1, 20, 3, 40]
 * ```
 */
export function filtered<A>(predicate: (a: A) => boolean): Lens<A[], A[]> {
  return new Lens<A[], A[]>(
    (arr: A[]) => arr.filter(predicate),
    (arr: A[], values: A[]) => {
      let valueIdx = 0;
      return Object.freeze(
        arr.map(item =>
          predicate(item) && valueIdx < values.length
            ? values[valueIdx++]
            : item
        )
      ) as A[];
    }
  );
}

/**
 * Create a lens that focuses on Maybe value
 *
 * @example
 * ```typescript
 * interface User { name: string; email?: string; }
 * const emailLens = maybeProp<User, 'email'>('email');
 *
 * const user = { name: 'Alice' };
 * const email = emailLens.get(user); // Maybe.none()
 * const updated = emailLens.set(user, Maybe.of('alice@example.com'));
 * // { name: 'Alice', email: 'alice@example.com' }
 * ```
 */
export function maybeProp<S, K extends keyof S>(
  key: K
): Lens<S, import('../monads/maybe').Maybe<S[K]>> {
  const { Maybe } = require('../monads/maybe');

  return new Lens<S, typeof Maybe>(
    (s: S) => Maybe.fromNullable(s[key]),
    (s: S, maybe: typeof Maybe) => {
      return maybe.fold(
        () => s, // None - keep original
        (value: S[K]) => Object.freeze({ ...s, [key]: value } as S)
      );
    }
  );
}

/**
 * View multiple properties at once
 *
 * @example
 * ```typescript
 * const coordsLens = view<Point, ['x', 'y']>('x', 'y');
 * const point = { x: 10, y: 20 };
 * const coords = coordsLens.get(point); // { x: 10, y: 20 }
 * const updated = coordsLens.set(point, { x: 30, y: 40 });
 * ```
 */
export function view<S, K extends keyof S>(
  ...keys: K[]
): Lens<S, Pick<S, K>> {
  return new Lens<S, Pick<S, K>>(
    (s: S) => {
      const result: any = {};
      for (const key of keys) {
        result[key] = s[key];
      }
      return result as Pick<S, K>;
    },
    (s: S, value: Pick<S, K>) => {
      return Object.freeze({ ...s, ...value } as S);
    }
  );
}

/**
 * Iso (Isomorphism) - bidirectional conversion
 *
 * @example
 * ```typescript
 * const celsiusToFahrenheit = iso<number, number>(
 *   c => c * 9/5 + 32,
 *   f => (f - 32) * 5/9
 * );
 *
 * const f = celsiusToFahrenheit.get(100); // 212
 * const c = celsiusToFahrenheit.reverseGet(212); // 100
 * ```
 */
export class Iso<S, A> {
  constructor(
    private readonly to: (s: S) => A,
    private readonly from: (a: A) => S
  ) {}

  get(source: S): A {
    return this.to(source);
  }

  reverseGet(value: A): S {
    return this.from(value);
  }

  modify(source: S, fn: (a: A) => A): S {
    return this.from(fn(this.to(source)));
  }

  compose<B>(other: Iso<A, B>): Iso<S, B> {
    return new Iso<S, B>(
      (s: S) => other.get(this.get(s)),
      (b: B) => this.reverseGet(other.reverseGet(b))
    );
  }

  reverse(): Iso<A, S> {
    return new Iso<A, S>(this.from, this.to);
  }

  toLens(): Lens<S, A> {
    return new Lens<S, A>(this.to, (_, a) => this.from(a));
  }
}

/**
 * Create an Iso
 */
export function iso<S, A>(to: (s: S) => A, from: (a: A) => S): Iso<S, A> {
  return new Iso(to, from);
}

/**
 * Traversal - focus on multiple values at once
 *
 * @example
 * ```typescript
 * const allNumbers = traversal<number[], number>();
 * const arr = [1, 2, 3];
 * const updated = allNumbers.modify(arr, n => n * 2);
 * // [2, 4, 6]
 * ```
 */
export class Traversal<S, A> {
  constructor(
    private readonly getAll: (s: S) => A[],
    private readonly setAll: (s: S, values: A[]) => S
  ) {}

  get(source: S): A[] {
    return this.getAll(source);
  }

  set(source: S, values: A[]): S {
    return this.setAll(source, values);
  }

  modify(source: S, fn: (a: A) => A): S {
    return this.setAll(source, this.getAll(source).map(fn));
  }

  modifyF<F>(
    source: S,
    _fn: (a: A) => F,
    applicative: {
      pure: <B>(b: B) => F;
      ap: (fab: F, fa: F) => F;
    }
  ): F {
    const values = this.getAll(source);
    // This is simplified - real implementation needs proper applicative handling
    return applicative.pure(this.setAll(source, values as any));
  }
}

/**
 * Create a traversal
 */
export function traversal<S, A>(
  getAll: (s: S) => A[],
  setAll: (s: S, values: A[]) => S
): Traversal<S, A> {
  return new Traversal(getAll, setAll);
}

/**
 * Helper: Create lens for builder state
 *
 * @example
 * ```typescript
 * const nameLens = builderLens<User, 'name'>('name');
 * const state = {};
 * const updated = nameLens.set(state, 'Alice');
 * ```
 */
export function builderLens<T, K extends keyof T>(
  key: K
): Lens<BuilderState<T>, T[K] | undefined> {
  return new Lens<BuilderState<T>, T[K] | undefined>(
    (state: BuilderState<T>) => state[key],
    (state: BuilderState<T>, value: T[K] | undefined) => {
      if (value === undefined) {
        const { [key]: removed, ...rest } = state;
        return Object.freeze(rest as BuilderState<T>);
      }
      return Object.freeze({
        ...state,
        [key]: value
      } as BuilderState<T>);
    }
  );
}

/**
 * Helper: Lift a regular function to work with lenses
 *
 * @example
 * ```typescript
 * const uppercase = (s: string) => s.toUpperCase();
 * const uppercaseLens = liftLens(nameLens, uppercase);
 * const updated = uppercaseLens(user);
 * ```
 */
export function liftLens<S, A>(
  lens: Lens<S, A>,
  fn: (a: A) => A
): (s: S) => S {
  return (s: S) => lens.modify(s, fn);
}

/**
 * Helper: Over - apply function through lens
 *
 * @example
 * ```typescript
 * const user = { name: 'alice' };
 * const updated = over(nameLens, s => s.toUpperCase(), user);
 * // { name: 'ALICE' }
 * ```
 */
export function over<S, A>(lens: Lens<S, A>, fn: (a: A) => A, source: S): S {
  return lens.modify(source, fn);
}

/**
 * Helper: Set value through lens
 */
export function set<S, A>(lens: Lens<S, A>, value: A, source: S): S {
  return lens.set(source, value);
}

/**
 * Helper: Get value through lens
 */
export function view_<S, A>(lens: Lens<S, A>, source: S): A {
  return lens.get(source);
}
