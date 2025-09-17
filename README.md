# stdresult

> A tiny, zero-dependency port of Rust’s `Result<T, E>` to TypeScript/JavaScript
> with ergonomic helpers, exhaustive checks, and great type inference.

`IResult<T, E>` models the outcome of an operation that can **succeed** (`Ok<T>`) or **fail** (`Err<E>`).
Instead of throwing, you **return** errors as values, making control-flow explicit and type-safe.

An asynchronous variant, `IAsyncResult<T, E>`, is also provided for working with `Promise`-based APIs.

---

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Comparison with Rust traits](#comparison-with-rust-traits)
<!-- - [Core Concepts](#core-concepts) -->
<!-- - [API Reference](#api-reference) -->
<!--   - [Type & Constructors](#type--constructors) -->
<!--   - [Type Guards](#type-guards) -->
<!--   - [Inspectors & Unwrapping](#inspectors--unwrapping) -->
<!--   - [Transformations](#transformations) -->
<!--   - [Control-Flow](#control-flow) -->
<!--   - [Combinators](#combinators) -->
<!--   - [Async Helpers](#async-helpers) -->
<!--   - [Interop](#interop) -->
<!-- - [Examples](#examples) -->
<!--   - [Validating input (Zod)](#validating-input-zod) -->
<!--   - [Wrapping exceptions](#wrapping-exceptions) -->
<!--   - [Fetching (node/web)](#fetching-nodeweb) -->
<!--   - [Express handler](#express-handler) -->
<!--   - [Parallel composition](#parallel-composition) -->
<!-- - [Design Notes](#design-notes) -->
<!-- - [FAQ](#faq) -->
<!-- - [Performance](#performance) -->
<!-- - [Comparison & Prior Art](#comparison--prior-art) -->
<!-- - [Contributing](#contributing) -->
<!-- - [License](#license) -->

---

## Install

The library is provided as ESM and CJS. TypeScript types are included.
Can be fetched from npm or jsr.

```bash
# npm
npm i stdresult

# pnpm
pnpm add stdresult

# yarn
yarn add stdresult

# deno
deno add jsr:@amountainram/stdresult
```

## Quick Start

```typescript
// node.js
import { Result } from "stdresult"

// deno
import { Result } from "jsr:@amountainram/stdresult"
// or (on deno)
import { Result } from "npm:stdresult"

const ok = Result.Ok<number, string>(42)
if (ok.isOk()) {
  expect(ok.value).toBe(42)
}
```

## Comparison with Rust traits

`IResult<T, E>` is roughly the `impl Result<T, E>` in Rust provided
by the standard library, wheres `IAsyncResult<T, E>` implements
`futures::future::TryFuture<Ok = T, Error = E>`.

Significant differences are:

- `mapOk` follows the naming of the `futures` library (it is `map` in std::result::Result).
- `andThen`, both on `IResult` and `IAsyncResult`, allows error mapping using the TS `or` operator (`|`): it is allows to return from closure any kind of error `E2` which will be mapped to `E | E2`.
- `unwrap` and `unwrapErr` do not panic, but throw exceptions 🤐
- `mapOrElse` on `IAsyncResult` is aligned with `std::result::Result` naming instead of `futures::future::TryFutureExt`.

