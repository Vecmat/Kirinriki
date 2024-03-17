/**
 * @Author: Hanrea
 * @Date: 2023/9/11 17:36:53
 * @LastEditors: Hanrea
 * @LastEditTime: 2023/9/11 17:36:53
 * Description:
 * Copyright: Copyright (©)}) 2023 Vecmat.com. All rights reserved.
 */

import { summary } from 'rollup-plugin-summary';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: ['src/index.ts'],
  output: [
    {
      dir: 'libs',
      format: "cjs",
      sourcemap: true,
      interop: 'auto',
      exports: 'named',
      preserveModules: true,
      entryFileNames: '[name].cjs'
    },
    {
      dir: 'libs',
      format: "esm",
      sourcemap: true,
      interop: 'auto',
      exports: 'named',
      preserveModules: true,
      entryFileNames: '[name].mjs'
    }
  ],
  plugins: [typescript({ tsconfig: 'tsconfig.build.json' }), nodeResolve(), summary()],
  external: [/node_modules/],
};


