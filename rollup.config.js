import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default {
  input: 'src/main.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'default',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      exports: 'default',
      sourcemap: true,
    },
    {
      file: pkg.browser,
      format: 'umd',
      name: 'ReversimMachine',
      exports: 'default',
      sourcemap: true,
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    url({
      include: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
      limit: Infinity,
      emitFiles: false,
      fileName: '[name][hash][extname]',
      destDir: 'dist/assets'
    }),
    json(),
    terser(), // Minify output
  ],
};
