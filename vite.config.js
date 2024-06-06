import { resolve as resolvePath } from 'path'
import { defineConfig } from 'vite'
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import summary from 'rollup-plugin-summary';

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolvePath(__dirname, 'lib/main.ts'),
      name: 'AIChatWidget',
      // the proper extensions will be added
      fileName: 'main',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['lit'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          lit: 'Lit',
        },
      },
    },
    // Generates source maps for debugging
    sourcemap: true,
    // Clears the output directory before building
    emptyOutDir: true,
  },
  plugins: [
    {
      // Resolve bare module specifiers to relative paths
      ...resolve(),
      enforce: 'post',
      apply: 'build',
    },
    {
      // Minify JS
      ...terser({
        ecma: 2021,
        module: true,
        warnings: true,
      }),
      enforce: 'post',
      apply: 'build',
    },
    {
      // Print bundle summary
      ...summary(),
      enforce: 'post',
      apply: 'build',
    },
  ],
});