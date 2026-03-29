# APSRT

**Automated property-based snapshot regression testing**

APSRT is a TypeScript tool for automated regression testing. It analyzes exported functions, generates property-based input samples from their types, and snapshots the results through Vitest.

This repository now keeps its own unit and integration tests separate from the packaged runtime entry so the implementation can be refactored safely.

## Features

- Generates runtime snapshot tests for exported TypeScript functions
- Uses [fast-check](https://github.com/dubzzz/fast-check) to create deterministic sample inputs
- Uses [Vitest](https://vitest.dev/) snapshots to detect regressions
- Uses [ts-morph](https://ts-morph.com/) and the TypeScript compiler to inspect function signatures

## How it works

1. APSRT loads a TypeScript config file from the current working directory.
2. It analyzes included `.ts` files and finds exported functions.
3. It creates input arbitraries based on parameter type text.
4. It runs each exported function with deterministic samples.
5. It snapshots the collected input/output pairs.

## Usage

Install dependencies:

```sh
npm install
```

Run the repo test suite:

```sh
npm test
```

Typecheck the source, tests, and fixtures:

```sh
npm run typecheck
```

Build the packaged CLI and runtime test entry:

```sh
npm run build
```

Run the packaged runtime test entry against another config file:

```sh
APSRT_TSCONFIG=tsconfig.fixtures.json npx vitest run src/runtime.test.ts
```

## Project Structure

- `src/` — CLI entry, packaged runtime entry, and core implementation
- `src/core/` — Type analysis, arbitrary creation, cache, and config loading
- `test/unit/` — Direct unit tests for core modules
- `test/integration/` — Fixture-based runtime flow coverage
- `test/fixtures/` — Sample exported functions used as test inputs

## Environment Variables

- `APSRT_TSCONFIG`: overrides the TypeScript config file name to load
- `APSRT_ENABLE_CACHE=false`: disables the on-disk analysis cache

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/)
- [fast-check](https://github.com/dubzzz/fast-check)
- [Vitest](https://vitest.dev/)
- [ts-morph](https://ts-morph.com/)

## License

MIT
