/**
 * gulp处理ws-ts生成后的publish文件夹
 * 1. 将src里的所有文件全部复制出来
 * 2. 将package.json 和 README.MD两个文件复制至publish
 */
// const fs = require( "fs" );
// const path = require( "path" );
const gulp = require( "gulp" );
const addSrc = require( "gulp-add-src" );

// 操作目录
const destination = "./dist";

gulp.task( "copy", () => {
    return gulp.src( "./README.MD" )
        .pipe( gulp.dest( destination ) )
        .pipe( addSrc( [
            ".npmignore",
            "./package.json"
        ] ) )
        .pipe( gulp.dest( destination ) );
} );
