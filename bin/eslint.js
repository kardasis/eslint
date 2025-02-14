#!/usr/bin/env node

/**
 * @fileoverview Main CLI that is run via the eslint command.
 * @author Nicholas C. Zakas
 */

/* eslint no-console:off */

"use strict";

// to use V8's code cache to speed up instantiation time
require("v8-compile-cache");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const useStdIn = process.argv.includes("--stdin"),
    init = process.argv.includes("--init"),
    debug = process.argv.includes("--debug");

// must do this initialization *before* other requires in order to work
if (debug) {
    require("debug").enable("eslint:*,-eslint:code-path");
}

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// now we can safely include the other modules that use debug
const path = require("path"),
    fs = require("fs"),
    cli = require("../lib/cli");

//------------------------------------------------------------------------------
// Execution
//------------------------------------------------------------------------------

process.once("uncaughtException", err => {

    // lazy load
    const lodash = require("lodash");

    if (typeof err.messageTemplate === "string" && err.messageTemplate.length > 0) {
        const template = lodash.template(fs.readFileSync(path.resolve(__dirname, `../messages/${err.messageTemplate}.txt`), "utf-8"));
        const pkg = require("../package.json");

        console.error("\nOops! Something went wrong! :(");
        console.error(`\nESLint: ${pkg.version}.\n\n${template(err.messageData || {})}`);
    } else {
        console.error(err.stack);
    }

    process.exitCode = 2;
});

if (useStdIn) {

    /*
     * Note: `process.stdin.fd` is not used here due to https://github.com/nodejs/node/issues/7439.
     * Accessing the `process.stdin` property seems to modify the behavior of file descriptor 0, resulting
     * in an error when stdin is piped in asynchronously.
     */
    const STDIN_FILE_DESCRIPTOR = 0;

    process.exitCode = cli.execute(process.argv, fs.readFileSync(STDIN_FILE_DESCRIPTOR, "utf8"));
} else if (init) {
    const configInit = require("../lib/init/config-initializer");

    configInit.initializeConfig().then(() => {
        process.exitCode = 0;
    }).catch(err => {
        process.exitCode = 1;
        console.error(err.message);
        console.error(err.stack);
    });
} else {
    process.exitCode = cli.execute(process.argv);
}
