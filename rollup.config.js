/**
 * @Author: Hanrea
 * @Date: 2023/9/11 17:36:53
 * @LastEditors: Hanrea
 * @LastEditTime: 2023/9/11 17:36:53
 * Description:
 * Copyright: Copyright (©)}) 2023 Vecmat.com. All rights reserved.
 */

import copy from 'rollup-plugin-copy'
import { summary } from 'rollup-plugin-summary';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

import esmShim from '@rollup/plugin-esm-shim';
import { nodeResolve } from '@rollup/plugin-node-resolve';
/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: ['src/index.ts'],
  output: [
    {
      dir: 'dist',
      format: "cjs",
      sourcemap: true,
      interop: 'auto',
      exports: 'named',
      preserveModules: true,
      entryFileNames: 'cjs/[name].cjs'
    },
    {
      dir: 'dist',
      format: "esm",
      sourcemap: true,
      interop: 'auto',
      exports: 'named',
      preserveModules: true,
      entryFileNames: 'esm/[name].mjs'
    }
  ],
  plugins: [
    typescript({ tsconfig: 'tsconfig.build.json' }),
    // commonjs(),
    summary(),

    esmShim(),
    copy({
      targets: [
        { src: 'README.md', dest: 'dist/' },
        { src: ".npmignore", dest: 'dist/' },
        {
          src: 'package.json', dest: 'dist/',
          // transform: (contents, filename) => {
          //   return contents.toString().replace('__SCRIPT__', 'app.js')
          // }
        },
      ]
    })
  ],
  external: [/node_modules/],
};


