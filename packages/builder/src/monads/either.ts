/**
 * Either Monad
 * Represents a value that can be one of two types (Left or Right)
 * Commonly used for error handling (Left = error, Right = success)
 */

/**
 * Either monad - represents a value that is either Left (error) or Right (success)
 * Provides type-safe error handling without exceptions
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Either<string, number> {
 *   if (b === 0) {
 *     return Either.left('Division by zero');
 *   }
 *   return Either.right(a / b);
 * }
 *
 * const result = divide(10, 2)
 *   .map(n => n * 2)
 *   .fold(
 *     error => console.error('Error:', error),
 *     value => console.log('Result:', value)
 *   );
 * ```
 */
export class Either<L, R> {
  private constructor(
    private readonly leftValue: L | null,
    private readonly rightValue: R | null
  ) {}

  /**
   * Create a Left (error/failure)
   */
  static left<L, R>(value: L): Either<L, R> {
    return new Either<L, R>(value, null);
  }

  /**
   * Create a Right (success/value)
   */
  static right<L, R>(value: R): Either<L, R> {
    return new Either<L, R>(null, value);
  }

  /**
   * Create Either from nullable value
   * null/undefined becomes Left, otherwise Right
   */
  static fromNullable<L, R>(value: R | null | undefined, left: L): Either<L, R> {
    return value == null ? Either.left(left) : Either.right(value);
  }

  /**
   * Create Either from predicate
   */
  static fromPredicate<L, R>(
    value: R,
    predicate: (value: R) => boolean,
    left: L
  ): Either<L, R> {
    return predicate(value) ? Either.right(value) : Either.left(left);
  }

  /**
   * Try to execute a function, catching errors
   *
   * @example
   * ```typescript
   * const result = Either.tryCatch(
   *   () => JSON.parse(jsonString),
   *   error => `Parse error: ${error.message}`
   * );
   * ```
   */
  static tryCatch<L, R>(
    fn: () => R,
    onError: (error: any) => L
  ): Either<L, R> {
    try {
      return Either.right(fn());
    } catch (error) {
      return Either.left(onError(error));
    }
  }

  /**
   * Check if this is a Left
   */
  isLeft(): boolean {
    return this.leftValue != null;
  }

  /**
   * Check if this is a Right
   */
  isRight(): boolean {
    return this.rightValue != null;
  }

  /**
   * Transform the Right value
   * Left values pass through unchanged
   *
   * @example
   * ```typescript
   * Either.right(5)
   *   .map(x => x * 2)
   *   .map(x => x + 1); // Either.right(11)
   *
   * Either.left('error')
   *   .map(x => x * 2); // Either.left('error')
   * ```
   */
  map<U>(fn: (value: R) => U): Either<L, U> {
    if (this.isLeft()) {
      return Either.left<L, U>(this.leftValue!);
    }
    return Either.right<L, U>(fn(this.rightValue!));
  }

  /**
   * Transform the Left value
   * Right values pass through unchanged
   *
   * @example
   * ```typescript
   * Either.left('error')
   *   .mapLeft(err => `ERROR: ${err}`); // Either.left('ERROR: error')
   *
   * Either.right(5)
   *   .mapLeft(err => `ERROR: ${err}`); // Either.right(5)
   * ```
   */
  mapLeft<U>(fn: (value: L) => U): Either<U, R> {
    if (this.isLeft()) {
      return Either.left<U, R>(fn(this.leftValue!));
    }
    return Either.right<U, R>(this.rightValue!);
  }

  /**
   * Transform both Left and Right
   *
   * @example
   * ```typescript
   * either.bimap(
   *   error => `ERROR: ${error}`,
   *   value => value * 2
   * );
   * ```
   */
  bimap<U, V>(
    leftFn: (value: L) => U,
    rightFn: (value: R) => V
  ): Either<U, V> {
    if (this.isLeft()) {
      return Either.left<U, V>(leftFn(this.leftValue!));
    }
    return Either.right<U, V>(rightFn(this.rightValue!));
  }

  /**
   * Transform the Right value and flatten the result
   *
   * @example
   * ```typescript
   * function parseJson(str: string): Either<string, any> {
   *   return Either.tryCatch(
   *     () => JSON.parse(str),
   *     err => `Parse error: ${err}`
   *   );
   * }
   *
   * Either.right('{"name":"Alice"}')
   *   .flatMap(parseJson)
   *   .map(obj => obj.name); // Either.right('Alice')
   * ```
   */
  flatMap<U>(fn: (value: R) => Either<L, U>): Either<L, U> {
    if (this.isLeft()) {
      return Either.left<L, U>(this.leftValue!);
    }
    return fn(this.rightValue!);
  }

  /**
   * Chain (alias for flatMap)
   */
  chain<U>(fn: (value: R) => Either<L, U>): Either<L, U> {
    return this.flatMap(fn);
  }

  /**
   * Fold Either into a single value
   *
   * @example
   * ```typescript
   * const message = divide(10, 0).fold(
   *   error => `Error: ${error}`,
   *   value => `Result: ${value}`
   * );
   * ```
   */
  fold<U>(onLeft: (left: L) => U, onRight: (right: R) => U): U {
    return this.isLeft() ? onLeft(this.leftValue!) : onRight(this.rightValue!);
  }

  /**
   * Get Right value or return default
   *
   * @example
   * ```typescript
   * Either.right(5).getOrElse(0); // 5
   * Either.left('error').getOrElse(0); // 0
   * ```
   */
  getOrElse(defaultValue: R): R {
    return this.isRight() ? this.rightValue! : defaultValue;
  }

  /**
   * Get Right value or compute default
   */
  getOrElseGet(fn: (left: L) => R): R {
    return this.isRight() ? this.rightValue! : fn(this.leftValue!);
  }

  /**
   * Get Right value or throw error
   */
  getOrThrow(): R {
    if (this.isLeft()) {
      throw new Error(`Either.getOrThrow: Left value is ${this.leftValue}`);
    }
    return this.rightValue!;
  }

  /**
   * Execute side effect on Right value
   */
  forEach(fn: (value: R) => void): void {
    if (this.isRight()) {
      fn(this.rightValue!);
    }
  }

  /**
   * Execute side effect on Left value
   */
  forEachLeft(fn: (value: L) => void): void {
    if (this.isLeft()) {
      fn(this.leftValue!);
    }
  }

  /**
   * Filter Right value based on predicate
   * If predicate fails, converts to Left
   *
   * @example
   * ```typescript
   * Either.right(25)
   *   .filter(age => age >= 18, 'Must be adult')
   *   .fold(
   *     error => console.error(error),
   *     age => console.log('Valid age:', age)
   *   );
   * ```
   */
  filter(predicate: (value: R) => boolean, leftValue: L): Either<L, R> {
    if (this.isLeft()) {
      return this;
    }
    return predicate(this.rightValue!) ? this : Either.left(leftValue);
  }

  /**
   * Provide alternative if this is Left
   *
   * @example
   * ```typescript
   * Either.left<string, number>('error')
   *   .orElse(Either.right(10))
   *   .getOrElse(0); // 10
   * ```
   */
  orElse(alternative: Either<L, R>): Either<L, R> {
    return this.isLeft() ? alternative : this;
  }

  /**
   * Provide alternative from function if this is Left
   */
  orElseGet(fn: (left: L) => Either<L, R>): Either<L, R> {
    return this.isLeft() ? fn(this.leftValue!) : this;
  }

  /**
   * Swap Left and Right
   *
   * @example
   * ```typescript
   * Either.right(5).swap(); // Either.left(5)
   * Either.left('error').swap(); // Either.right('error')
   * ```
   */
  swap(): Either<R, L> {
    return this.isLeft()
      ? Either.right<R, L>(this.leftValue!)
      : Either.left<R, L>(this.rightValue!);
  }

  /**
   * Convert to Maybe
   * Left becomes None, Right becomes Some
   */
  toMaybe(): import('./maybe').Maybe<R> {
    const { Maybe } = require('./maybe');
    return this.isRight() ? Maybe.of(this.rightValue!) : Maybe.none();
  }

  /**
   * Convert to array
   * Left becomes empty array, Right becomes single-element array
   */
  toArray(): R[] {
    return this.isRight() ? [this.rightValue!] : [];
  }

  /**
   * Check equality with another Either
   */
  equals(other: Either<L, R>): boolean {
    if (this.isLeft() && other.isLeft()) {
      return this.leftValue === other.leftValue;
    }
    if (this.isRight() && other.isRight()) {
      return this.rightValue === other.rightValue;
    }
    return false;
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.isLeft()
      ? `Either.Left(${this.leftValue})`
      : `Either.Right(${this.rightValue})`;
  }

  /**
   * Apply function in Either to value in Either
   *
   * @example
   * ```typescript
   * const add = (a: number) => (b: number) => a + b;
   * Either.right(add)
   *   .ap(Either.right(5))
   *   .ap(Either.right(3)); // Either.right(8)
   * ```
   */
  ap<U>(fab: Either<L, (value: R) => U>): Either<L, U> {
    return fab.flatMap(fn => this.map(fn));
  }
}

/**
 * Utility functions for Either
 */

/**
 * Sequence an array of Eithers into Either of array
 * Returns first Left encountered, or Right with all values
 *
 * @example
 * ```typescript
 * const eithers = [Either.right(1), Either.right(2), Either.right(3)];
 * sequence(eithers); // Either.right([1, 2, 3])
 *
 * const withError = [Either.right(1), Either.left('error'), Either.right(3)];
 * sequence(withError); // Either.left('error')
 * ```
 */
export function sequence<L, R>(eithers: Either<L, R>[]): Either<L, R[]> {
  const results: R[] = [];

  for (const either of eithers) {
    if (either.isLeft()) {
      return Either.left(either.fold(l => l, () => null as any));
    }
    results.push(either.getOrThrow());
  }

  return Either.right(results);
}

/**
 * Traverse an array with an Either-returning function
 */
export function traverse<L, A, B>(
  arr: A[],
  fn: (value: A) => Either<L, B>
): Either<L, B[]> {
  return sequence(arr.map(fn));
}

/**
 * Lift a regular function to work with Either
 *
 * @example
 * ```typescript
 * const add = (a: number, b: number) => a + b;
 * const addEither = liftEither2(add);
 *
 * addEither(Either.right(5), Either.right(3)); // Either.right(8)
 * addEither(Either.right(5), Either.left('error')); // Either.left('error')
 * ```
 */
export function liftEither2<L, A, B, R>(
  fn: (a: A, b: B) => R
): (ea: Either<L, A>, eb: Either<L, B>) => Either<L, R> {
  return (ea: Either<L, A>, eb: Either<L, B>) =>
    ea.flatMap(a => eb.map(b => fn(a, b)));
}

/**
 * Lift function with 3 parameters
 */
export function liftEither3<L, A, B, C, R>(
  fn: (a: A, b: B, c: C) => R
): (ea: Either<L, A>, eb: Either<L, B>, ec: Either<L, C>) => Either<L, R> {
  return (ea: Either<L, A>, eb: Either<L, B>, ec: Either<L, C>) =>
    ea.flatMap(a => eb.flatMap(b => ec.map(c => fn(a, b, c))));
}

/**
 * Find first Right in array
 */
export function firstRight<L, R>(eithers: Either<L, R>[]): Either<L, R> {
  for (const either of eithers) {
    if (either.isRight()) {
      return either;
    }
  }
  return eithers[eithers.length - 1] || Either.left(null as any);
}

/**
 * Collect all Lefts
 */
export function lefts<L, R>(eithers: Either<L, R>[]): L[] {
  return eithers
    .filter(e => e.isLeft())
    .map(e => e.fold(l => l, () => null as any));
}

/**
 * Collect all Rights
 */
export function rights<L, R>(eithers: Either<L, R>[]): R[] {
  return eithers
    .filter(e => e.isRight())
    .map(e => e.getOrThrow());
}

/**
 * Partition Eithers into Lefts and Rights
 */
export function partitionEithers<L, R>(
  eithers: Either<L, R>[]
): [L[], R[]] {
  return [lefts(eithers), rights(eithers)];
}

/**
 * Check if all Eithers are Right
 */
export function allRight<L, R>(eithers: Either<L, R>[]): boolean {
  return eithers.every(e => e.isRight());
}

/**
 * Check if any Either is Right
 */
export function anyRight<L, R>(eithers: Either<L, R>[]): boolean {
  return eithers.some(e => e.isRight());
}

/**
 * Validation - collect all errors
 * Unlike sequence, this collects ALL errors instead of failing fast
 *
 * @example
 * ```typescript
 * const validations = [
 *   Either.left(['Error 1']),
 *   Either.left(['Error 2']),
 *   Either.right(5)
 * ];
 *
 * validation(validations); // Either.left(['Error 1', 'Error 2'])
 * ```
 */
export function validation<L, R>(eithers: Either<L[], R>[]): Either<L[], R[]> {
  const errors: L[] = [];
  const values: R[] = [];

  for (const either of eithers) {
    either.fold(
      errs => errors.push(...errs),
      val => values.push(val)
    );
  }

  return errors.length > 0 ? Either.left(errors) : Either.right(values);
}
