import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: false,
  clean: false,
  dts: true,
  outDir: '.',
  external: [/^\.\/polodb.*\.node$/, /^@sebwojtasik\/polodb.*/],
})
