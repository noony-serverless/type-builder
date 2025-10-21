/**
 * Safe Values Module (Monads)
 * Handle nullable values and errors without crashes or exceptions
 *
 * @packageDocumentation
 * @module safe-values
 */

// Maybe Monad - Handle nullable/optional values
export {
  Maybe,
  sequence as sequenceMaybe,
  traverse as traverseMaybe,
  liftMaybe2,
  liftMaybe3,
  firstSome,
  allSome,
  anySome,
} from './maybe';

// Either Monad - Error handling with type-safe validation
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
  validation,
} from './either';

// Type exports
export type { Maybe as MaybeType } from './maybe';
export type { Either as EitherType } from './either';
