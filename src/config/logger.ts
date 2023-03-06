/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
export default {
    output: ["Console", "File"],
    File: {
        level: "info",
        filename: "/log-%DATE%.log",
        handleExceptions: true,
        json: true,
        datePattern: "YYYY-MM-DD-HH",
        // zippedArchive: true,
        maxSize: "20m",
        // maxFiles: '7d',
        colorize: false,
        timestamp: true
    },
    Console: {
        level: "debug",
        handleExceptions: true,
        json: true,
        colorize: true,
        timestamp: true
    }
};
