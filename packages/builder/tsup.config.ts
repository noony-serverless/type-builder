import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts', // Main entry point (everything consolidated)
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  target: 'es2020',
  outDir: 'dist',
  external: ['zod'],
});
