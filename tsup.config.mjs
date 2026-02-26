import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'lib/pardis-jalali-datepicker.js' },
  format: ['esm', 'cjs', 'iife'],
  globalName: 'PardisJalaliDatepicker',
  outDir: 'dist',
  clean: true,
  minify: false,
  splitting: false,
  sourcemap: false,
  dts: false,
  outExtension({ format }) {
    if (format === 'cjs') return { js: '.cjs' };
    return {};
  },
});
