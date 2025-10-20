/**
 * Optics Module
 * Functional lenses and prisms for immutable nested updates
 */

// Lens exports
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
} from './optics/lens';

// Prism exports
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
} from './optics/prism';

/**
 * Re-export types for convenience
 */
export type { Lens as LensType, Iso as IsoType, Traversal as TraversalType } from './optics/lens';
export type { Prism as PrismType } from './optics/prism';
