/**
 * Monads Module
 * Functional error handling and optional value patterns
 */

// Maybe Monad
export {
  Maybe,
  sequence as sequenceMaybe,
  traverse as traverseMaybe,
  liftMaybe2,
  liftMaybe3,
  firstSome,
  allSome,
  anySome
} from './monads/maybe';

// Either Monad
export {
  Either,
  sequence as sequenceEither,
  traverse as traverseEither,
  liftEither2,
  liftEither3,
  firstRight,
  lefts,
  rights,
  partitionEithers,
  allRight,
  anyRight,
  validation
} from './monads/either';

/**
 * Re-export types for convenience
 */
export type { Maybe as MaybeType } from './monads/maybe';
export type { Either as EitherType } from './monads/either';
