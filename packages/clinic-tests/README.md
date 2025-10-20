# @ultra-fast-builder/clinic-tests

Clinic.js performance tests and interactive dashboard for UltraFastBuilder.

## Quick Start

### Prerequisites

```bash
# Build the main library first
cd ../builder
npm run build
cd ../clinic-tests
```

### Running Tests

```bash
# Install dependencies
npm install

# Build tests
npm run build

# Run all Clinic.js tests
npm run test

# Start interactive dashboard
npm run serve
# Open http://localhost:3000
```

## Available Scripts

| Script                | Description                         |
| --------------------- | ----------------------------------- |
| `build`               | Compile TypeScript to JavaScript    |
| `test`                | Run all Clinic.js performance tests |
| `serve`               | Start interactive dashboard server  |
| `clinic:doctor`       | Run Clinic.js doctor analysis       |
| `clinic:flame`        | Run Clinic.js flame graph analysis  |
| `clinic:bubbleprof`   | Run Clinic.js bubble profiler       |
| `clinic:heapprofiler` | Run Clinic.js heap profiler         |

## Test Types

### Interface Builder Tests

- **Performance**: ~400,000 ops/sec
- **Memory**: ~60 bytes/object
- **Use Case**: Internal DTOs, high-throughput scenarios

### Class Builder Tests

- **Performance**: ~300,000 ops/sec
- **Memory**: ~80 bytes/object
- **Use Case**: Domain models with methods

### Zod Builder Tests

- **Performance**: ~100,000 ops/sec
- **Memory**: ~90 bytes/object
- **Use Case**: API boundaries, user input validation

### Functional Programming Tests

- Compose operations
- Higher-order functions
- Monadic operations
- Optics (Lens/Prism)

## Interactive Dashboard

The dashboard provides real-time performance visualization:

- **Live Performance Graphs**: Real-time performance monitoring
- **Interactive Controls**: Adjust iterations and test scenarios
- **Export Data**: Download benchmark results as JSON
- **Multiple Views**: Bar charts, line graphs, and comparisons

### Accessing the Dashboard

1. Start the server: `npm run serve`
2. Open browser to: http://localhost:3000
3. Select dashboard type:
   - Builder Performance Dashboard
   - Functional Programming Dashboard

## Troubleshooting

### CORS Errors

```bash
# ❌ Don't open HTML directly
open builder_visual_dashboard.html

# ✅ Use the server instead
npm run serve
# Then open http://localhost:3000
```

### Library Load Failed

1. Ensure builder package is built: `cd ../builder && npm run build`
2. Check dist folder exists: `ls ../builder/dist/`
3. Verify server is running correctly

### Performance Issues

- Use `--max-old-space-size=4096` for large tests
- Run on idle systems for consistent results
- Warm up before benchmarking

## File Structure

```
packages/clinic-tests/
├── src/
│   ├── tests/                    # Test implementations
│   │   ├── interface-clinic-test.ts
│   │   ├── class-clinic-test.ts
│   │   ├── zod-clinic-test.ts
│   │   └── functional-clinic-test.ts
│   └── index.ts                  # Main test runner
├── builder_visual_dashboard.html # Builder performance dashboard
├── functional_visual_dashboard.html # Functional programming dashboard
├── server.js                     # HTTP server
└── package.json
```

## Integration

### CI/CD Pipeline

```yaml
- name: Run Clinic.js Tests
  run: |
    cd packages/clinic-tests
    npm run build
    npm run test
```

### Custom Tests

```typescript
import { runClinicTest } from './src/tests/test-utils';

// Create custom performance test
runClinicTest(
  'My Test',
  () => {
    // Your performance-critical code
  },
  100000
);
```

## License

MIT © UltraFastBuilder Team
