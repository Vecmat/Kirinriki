/**
 * @Author: Hanrea
 * @Date: 2023/9/11 17:36:53
 * @LastEditors: Hanrea
 * @LastEditTime: 2023/9/11 17:36:53
 * Description: 
 * Copyright: Copyright (©)}) 2023 Vecmat.com. All rights reserved.
 */

import json from "@rollup/plugin-json";
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
export default [
    {
        input: './src/index.ts',
        output: [{
            format: 'cjs',
            file: './dist/index.js',
            banner: require('./scripts/copyright')
        }],
        external: ["@vecmat/printer","@vecmat/vendor"],
        plugins: [
            commonjs(),
            // babel({
            //     babelHelpers: "runtime",
            //     configFile: './babel.config.js',
            //     exclude: 'node_modules/**',
            // }),
            json(),
            typescript({
                tsconfig: './tsconfig.json',
                tsconfigOverride: {
                    compilerOptions: {
                        declaration: false,
                        declarationMap: false,
                        module: "ESNext"
                    }
                }
            }),
            // babel(),
            // uglify()
        ]
    },
    {
        input: './src/index.ts',
        output: [{
            format: 'es',
            file: './dist/index.mjs',
            banner: require('./scripts/copyright')
        }],
        plugins: [
            babel({
                babelHelpers: "runtime",
                configFile: './babel.config.js',
                exclude: 'node_modules/**',
            }),
            json(),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        declaration: false,
                        declarationMap: false,
                        module: "ESNext"
                    }
                }
            }),
            // babel(),
            uglify()
        ]
    }
]