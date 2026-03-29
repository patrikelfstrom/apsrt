# APSRT

**Automated Property-based Snapshot Regression Testing**

APSRT is a TypeScript tool for automated regression testing. It analyzes exported functions, generates property-based input samples from their types, and snapshots the results through Vitest.

## Usage

Install APSRT in the project you want to test:

```sh
npm install --save-dev @patrikelfstrom/apsrt
```

Or run it without adding it to `package.json`:

```sh
npx @patrikelfstrom/apsrt
```

By default it will use your local `tsconfig.json`.

```sh
# Use a specific tsconfig file
npx apsrt --tsconfig tsconfig.app.json

# Update snapshots
npx apsrt --update

# Watch for changes and re-run tests
npx apsrt --watch
```

Snapshots are stored in `.apsrt/__snapshots__/runtime.test.js.snap` inside the project you run APSRT from.

If APSRT detects a likely nondeterministic function such as one using `Math.random()`, it will stop and ask you to add an `@apsrt-ignore` annotation to that export.

## Developer

Clone the repository and install dependencies:

```sh
git clone git@github.com:PatrikElfstrom/apsrt.git
cd apsrt
npm install
```

Common development commands:

```sh
npm run build
npm test
npm run typecheck
```

### Features

- Generates runtime snapshot tests for exported TypeScript functions
- Uses [fast-check](https://github.com/dubzzz/fast-check) to create deterministic sample inputs
- Uses [Vitest](https://vitest.dev/) snapshots to detect regressions
- Uses [ts-morph](https://ts-morph.com/) and the TypeScript compiler to inspect function signatures

### How it works

1. APSRT loads a TypeScript config file from the current working directory.
2. It analyzes included `.ts` files and finds exported functions.
3. It creates input arbitraries based on parameter type text.
4. It runs each exported function with deterministic samples.
5. It snapshots the collected input/output pairs.

### Project Structure

- `src/` - CLI entry, packaged runtime entry, and core implementation
- `src/core/` - Type analysis, arbitrary creation, cache, and config loading
- `test/unit/` - Direct unit tests for core modules
- `test/integration/` - Fixture-based runtime flow coverage
- `test/fixtures/` - Sample exported functions used as test inputs

### Environment Variables

- `APSRT_TSCONFIG`: overrides the TypeScript config file name to load
- `APSRT_ENABLE_CACHE=false`: disables the on-disk analysis cache

### Tech Stack

- [TypeScript](https://www.typescriptlang.org/)
- [fast-check](https://github.com/dubzzz/fast-check)
- [Vitest](https://vitest.dev/)
- [ts-morph](https://ts-morph.com/)

### License

MIT
