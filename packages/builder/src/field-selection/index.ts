// Main customPicker API
export {
  customPicker,
  pickFields,
  pickFieldsArray,
  createPicker,
  omitFields,
  projectToInterface,
  projectByShape,
  createShapeProjector,
  projectArrayByShape,
} from './custom-picker';

// Schema building utilities
export {
  buildProjectionSchema,
  mergeSchemas,
  makeSchemaStrict,
  makeSchemaPassthrough,
} from './schema-builder';

// Path parsing utilities
export {
  parsePath,
  buildPathTree,
  normalizePaths,
  getCacheKey,
  isArrayPath,
  getArrayFieldName,
} from './path-parser';

// Schema cache
export {
  SchemaCache,
  getGlobalSchemaCache,
  clearGlobalSchemaCache,
  getGlobalSchemaCacheStats,
  resetGlobalSchemaCacheStats,
} from './schema-cache';

// Types
export type {
  ProjectionPath,
  ProjectionSelector,
  PickerOptions,
  PathSegment,
  SchemaCacheStats,
  KeysOf,
  PickKeys,
} from './types';

export type { PathTree } from './path-parser';
