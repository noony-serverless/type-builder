import { runInterfaceClinicTest } from './tests/interface-clinic-test';
import { runClassClinicTest } from './tests/class-clinic-test';
import { runZodClinicTest, runZodAsyncClinicTest } from './tests/zod-clinic-test';

async function runAllClinicTests(): Promise<void> {
  console.log('🏥 Clinic.js Performance Tests');
  console.log('===============================');
  console.log('');

  // Warm up
  console.log('🔥 Warming up...');
  runInterfaceClinicTest();
  runClassClinicTest();
  runZodClinicTest();
  console.log('');

  // Run all tests
  console.log('Running Interface Builder Test...');
  runInterfaceClinicTest();

  console.log('Running Class Builder Test...');
  runClassClinicTest();

  console.log('Running Zod Builder Test...');
  runZodClinicTest();

  console.log('Running Zod Async Builder Test...');
  await runZodAsyncClinicTest();

  console.log('✅ All Clinic.js tests completed!');
  console.log('Check the generated .clinic files for detailed performance analysis.');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllClinicTests().catch(console.error);
}

export {
  runInterfaceClinicTest,
  runClassClinicTest,
  runZodClinicTest,
  runZodAsyncClinicTest
};
