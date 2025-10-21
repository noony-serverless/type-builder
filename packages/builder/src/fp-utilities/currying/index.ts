/**
 * Currying & Partial Application
 * Create reusable function templates
 */

export {
  curriedBuilder,
  curry,
  curry2,
  curry3,
  curry4,
  autoCurry,
  uncurry2,
  uncurry3,
  flip,
  curriedBuilderWithSchema,
  memoizeCurried,
} from './curry';

export {
  partial,
  partialDefaults,
  partialOverwrite,
  partialTemplates,
  partialWith,
  partialIf,
  partialFrom,
  mergePartials,
  partialApply,
  partialWithSchema,
} from './partial';
