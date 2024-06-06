import { resolve } from 'path'
import { defineConfig } from 'vite'
// import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import summary from 'rollup-plugin-summary';

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'lib/main.ts'),
      name: 'ai-chat-widget',
      // the proper extensions will be added
      fileName: 'main',
      formats: ['es'],
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
      plugins: [
        // Resolve bare module specifiers to relative paths
        // NB!: This doesn't work through Vite for some reason.
        // Because of this rollup is used directly after Vite finishes. Check package.json > build script.
        // nodeResolve(),
        // Minify JS
        terser({
          ecma: 2021,
          module: true,
          warnings: true,
        }),
        // Print bundle summary
        summary(),
      ],
    },
    // Generates source maps for debugging
    sourcemap: true,
    // Clears the output directory before building
    emptyOutDir: true,
  },
});