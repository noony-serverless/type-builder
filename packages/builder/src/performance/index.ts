/**
 * Performance Module
 * Object pooling and performance optimization utilities
 *
 * @packageDocumentation
 * @module performance
 */

export { FastObjectPool, BuilderPool } from './object-pool';

// Types (re-export from core since object-pool needs BuilderInstance)
export type { ObjectPool, PerformanceMetrics } from '../core/types';
