# @ultra-fast-builder/benchmarks

Performance benchmarks for the UltraFastBuilder TypeScript library.

## Overview

This package contains comprehensive performance benchmarks that test the speed, memory usage, and efficiency of different builder patterns in the UltraFastBuilder library.

## Features

- **Multiple Builder Types**: Interface, Class, and Zod builders
- **Performance Metrics**: Operations per second, memory usage, and execution time
- **Memory Analysis**: Memory consumption and garbage collection impact
- **Comparison Tests**: Head-to-head comparisons with other approaches
- **Functional Programming**: Benchmarks for functional programming patterns
- **Async Performance**: Non-blocking validation performance tests

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Build the main library first
cd ../builder
npm run build
cd ../benchmarks
```

### Running Benchmarks

```bash
# Build the benchmarks
npm run build

# Run all benchmarks
npm run benchmark

# Run specific benchmark types
node dist/benchmarks/interface-benchmark.js
node dist/benchmarks/class-benchmark.js
node dist/benchmarks/zod-benchmark.js
node dist/benchmarks/functional-benchmark.js
```

### Using Clinic.js for Profiling

```bash
# Doctor analysis (CPU and memory)
npm run clinic

# Flame graph analysis
npm run clinic:flame

# Bubble profiler (async operations)
npm run clinic:bubbleprof
```

## Benchmark Types

### 1. Interface Builder Benchmarks

- **Performance**: ~400,000 ops/sec
- **Memory**: ~60 bytes per object
- **Use Case**: Internal DTOs, high-throughput scenarios
- **Validation**: None (compile-time only)

### 2. Class Builder Benchmarks

- **Performance**: ~300,000 ops/sec
- **Memory**: ~80 bytes per object
- **Use Case**: Domain models with methods
- **Validation**: None (methods preserved)

### 3. Zod Builder Benchmarks

- **Performance**: ~100,000 ops/sec
- **Memory**: ~90 bytes per object
- **Use Case**: API boundaries, user input validation
- **Validation**: Full runtime validation

### 4. Functional Programming Benchmarks

- **Compose Operations**: Function composition performance
- **Higher-Order Functions**: Map, filter, reduce patterns
- **Monadic Operations**: Either and Maybe monad performance
- **Optics**: Lens and Prism operations

## Available Scripts

| Script              | Description                        |
| ------------------- | ---------------------------------- |
| `build`             | Compile TypeScript to JavaScript   |
| `benchmark`         | Run all performance benchmarks     |
| `clinic`            | Run Clinic.js doctor analysis      |
| `clinic:flame`      | Run Clinic.js flame graph analysis |
| `clinic:bubbleprof` | Run Clinic.js bubble profiler      |
| `clean`             | Remove dist directory              |

## Benchmark Results

### Performance Comparison

| Builder Type | Ops/Sec | Time/Op | Memory/Obj | Use Case       |
| ------------ | ------- | ------- | ---------- | -------------- |
| Interface    | 420,000 | 2.4μs   | 60 bytes   | Internal DTOs  |
| Class        | 310,000 | 3.2μs   | 80 bytes   | Domain models  |
| Zod          | 105,000 | 9.5μs   | 90 bytes   | API validation |

### Memory Analysis

- **Object Pooling**: 98.5% hit rate
- **GC Impact**: Minimal with object pooling
- **Memory Growth**: Linear with object count
- **Peak Usage**: ~100MB for 1M objects

## Custom Benchmarks

### Creating Custom Benchmarks

```typescript
import { runBenchmark } from './benchmarks/benchmark-utils';

// Define your test function
function myTestFunction() {
  // Your code here
}

// Run benchmark
runBenchmark('My Custom Test', myTestFunction, 100000);
```

### Memory Testing

```typescript
import { runMemoryTest } from './benchmarks/memory-utils';

// Test memory usage
runMemoryTest(
  'Memory Test',
  () => {
    // Your memory-intensive code
  },
  10000
);
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Performance Benchmarks
on: [push, pull_request]

jobs:
  benchmarks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run benchmark
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure the main builder package is built first
2. **Memory Issues**: Use `--max-old-space-size=4096` for large benchmarks
3. **Timeout Errors**: Increase timeout for slow benchmarks

### Performance Tips

1. **Warmup**: Always warm up before benchmarking
2. **Multiple Runs**: Run benchmarks multiple times for accuracy
3. **System Load**: Run on idle systems for consistent results
4. **Memory Cleanup**: Clear pools between test runs

## Contributing

To add new benchmarks:

1. Create a new file in `src/benchmarks/`
2. Export your benchmark functions
3. Add them to `src/index.ts`
4. Update this README with results

## License

MIT © UltraFastBuilder Team
