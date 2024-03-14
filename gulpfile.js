/**
 * gulp处理ws-ts生成后的publish文件夹
 * 1. 将src里的所有文件全部复制出来
 * 2. 将package.json 和 README.MD两个文件复制至publish
 */

const { task, src, dest } = require('gulp');



task("copy", (cb) => {
  src([
    './README.MD',
    ".npmignore",
    "tsconfig.json",
    "./package.json"
  ]).pipe(dest('./dist/'))

  cb()
})



