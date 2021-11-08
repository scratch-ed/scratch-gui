# @ftrprf/judge-core

This is the core library used to run tests on scratch projects.

## Running

By itself, this does nothing. It is a library. Since Scratch requires a browser canvas to execute, you must run this in the browser to actually test something.

The "driver" package integrates the library with puppeteer to run a test on given Scratch project. This is probably what you want.
