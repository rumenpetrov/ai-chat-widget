import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'lib/main.ts'),
      name: 'AIChatWidget',
      // the proper extensions will be added
      fileName: 'ai-chat-widget',
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
})