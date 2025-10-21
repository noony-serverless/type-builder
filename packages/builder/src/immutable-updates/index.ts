/**
 * Immutable Updates Module (Optics)
 * Update deeply nested objects without mutation or boilerplate
 *
 * @packageDocumentation
 * @module immutable-updates
 */

// Lens exports - Nested property updates
export {
  Lens,
  lens,
  prop,
  path,
  composeLenses,
  index,
  filtered,
  maybeProp,
  view,
  Iso,
  iso,
  Traversal,
  traversal,
  builderLens,
  liftLens,
  over,
  set,
  view_ as viewLens,
} from './lens';

// Prism exports - Union/optional type updates
export {
  Prism,
  prism,
  prismFromPredicate,
  prismSome,
  prismRight,
  prismLeft,
  prismIndex,
  prismHead,
  prismTail,
  prismFind,
  prismType,
  prismInstanceOf,
  prismTypeOf,
  prismJson,
  prismProp,
  composePrisms,
  modifyOption,
  setOption,
  getOption,
  partial,
  at,
} from './prism';

// Type exports
export type { Lens as LensType, Iso as IsoType, Traversal as TraversalType } from './lens';
export type { Prism as PrismType } from './prism';
