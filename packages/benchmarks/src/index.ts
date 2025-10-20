import { runInterfaceBenchmark, runInterfaceMemoryTest } from './benchmarks/interface-benchmark';
import { runClassBenchmark, runClassMemoryTest } from './benchmarks/class-benchmark';
import {
  runZodBenchmark,
  runZodAsyncBenchmark,
  runZodMemoryTest,
} from './benchmarks/zod-benchmark';
import { runComparisonBenchmark, runMemoryComparison } from './benchmarks/comparison-benchmark';
import {
  runFunctionalBenchmark,
  runComposeBenchmark,
  runHigherOrderBenchmark,
  runFunctionalMemoryTest,
} from './benchmarks/functional-benchmark';

async function runAllBenchmarks(): Promise<void> {
  console.log('🎯 UltraFastBuilder Performance Benchmarks');
  console.log('==========================================');
  console.log('');

  // Warm up
  console.log('🔥 Warming up...');
  runInterfaceBenchmark(10000);
  runClassBenchmark(10000);
  runZodBenchmark(10000);
  console.log('');

  // Interface benchmarks
  runInterfaceBenchmark(1000000);
  runInterfaceMemoryTest(100000);

  // Class benchmarks
  runClassBenchmark(1000000);
  runClassMemoryTest(100000);

  // Zod benchmarks
  runZodBenchmark(100000);
  await runZodAsyncBenchmark(10000);
  runZodMemoryTest(100000);

  // Comparison benchmarks
  runComparisonBenchmark(100000);
  runMemoryComparison(100000);

  // Functional programming benchmarks
  runFunctionalBenchmark(100000);
  runComposeBenchmark(100000);
  runHigherOrderBenchmark(10000);
  runFunctionalMemoryTest(100000);

  console.log('✅ All benchmarks completed!');
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  runAllBenchmarks().catch(console.error);
}

export {
  runInterfaceBenchmark,
  runInterfaceMemoryTest,
  runClassBenchmark,
  runClassMemoryTest,
  runZodBenchmark,
  runZodAsyncBenchmark,
  runZodMemoryTest,
  runComparisonBenchmark,
  runMemoryComparison,
  runFunctionalBenchmark,
  runComposeBenchmark,
  runHigherOrderBenchmark,
  runFunctionalMemoryTest,
};
