
# stdresult

A tiny, zero-dependency port of Rust’s `Result<T, E>` to TypeScript/JavaScript, with ergonomic helpers, exhaustive checks, and strong type inference.

`IResult<T, E>` models the outcome of an operation that can **succeed** (`Ok<T, E>`) or **fail** (`Err<T, E>`). Instead of throwing, you **return** errors as values, making control flow explicit and type-safe.

An asynchronous variant, `IAsyncResult<T, E>`, is also provided for working with `Promise`-based APIs.

---

## Table of Contents

- [stdresult](#stdresult)
  - [Table of Contents](#table-of-contents)
  - [The Problem](#the-problem)
    - [The `unsafe` World](#the-unsafe-world)
    - [The `safe` World](#the-safe-world)
  - [Install](#install)
  - [Quick Start](#quick-start)
  - [Usage](#usage)
    - [Sync](#sync)
    - [Async](#async)
  - [API](#api)
  - [Globals](#globals)
  - [Comparison with Rust traits](#comparison-with-rust-traits)

---

## The Problem

> Disclaimer: The terms `safe` and `unsafe` here refer to the ability (or not) to infer error types across functions and code blocks. In other words, whether or not using a TypeScript `as` cast is safe.

This library attempts to translate some type concepts into TypeScript, but due to the language itself, it is basically trying to solve an _unsolvable problem_ (and, of course, it fails 🤫).

The long-standing issue of error handling in JavaScript can be summarized as:

1. Function signatures **do not allow** error type inference.
2. `try/catch` blocks and `Promise` rejections cannot be safely typed beyond `unknown` or `any`.
3. This forces the safety-minded developer to handle every catch block with code that checks all possible JavaScript types (often with many `instanceof` checks).
4. Eventually, most developers stop caring: they usually just re-`throw` and promise to handle it later (which means never).


A partial solution may involve linting to enforce that the argument of a `Promise.reject` is an `Error`. This approach simplifies point (3) but ultimately cannot solve the problem.

Because the problem cannot be solved within the language.

### The `unsafe` World

The approach proposed by this library is inspired by Rust’s `unsafe` blocks:

> Some things cannot be made safe. Let’s make our code safe and keep dangerous parts contained in unsafe blocks.

Here, the unsafe world includes:

- Platform globals (`fetch`, `URL`, `JSON.parse`, ...)
- Any third-party library not implementing safe errors
- `async/await` blocks

The last point requires a remark. Consider the following:

```typescript
const fn = async () => {
  return 42
}
```


Type inference here says that the return type is `Promise<number>`. But we know, by inspecting the code, that this function will never throw.


We may be tempted to try:

```typescript
const almostFn = async (): PromiseLike<number> => {
  return 42
}
```


But here TypeScript complains about a type mismatch. So there is no way to reconcile:

- error type knowledge
- `async/await` keywords
- TypeScript code annotations

### The `safe` World

The `unsafe` world is just **too big**—and **unavoidable**.

The aim of this library is not to rewrite all code in a safe fashion. However, small parts of your code may benefit from enforced type safety. Using this approach, utilities or small, contained business logic can present more ergonomic APIs to users.

> An example of a library that implements a safe return type is [zod](https://zod.dev/basics#parsing-data) with its `safeParse` and `safeParseAsync` methods.


## Install

The library is provided as ESM and CJS. TypeScript types are included. You can install it from npm or jsr.

```bash

# npm
npm install stdresult

# pnpm
pnpm add stdresult

# yarn
yarn add stdresult

# deno
deno add jsr:@amountainram/stdresult
```


The browser bundle is located at `./dist/index.min.js`.

```html
<script type="module">
  import { Result } from "https://cdn.jsdelivr.net/npm/stdresult@0.2.5/dist/index.min.js"

  // your code
</script>
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


Create a function that cannot throw by using results and consistently handling return types:

```typescript
import { Result, NativeSyntaxError } from 'stdresult'

const safeJsonParse = (input: string): IResult<unknown, >
```

## Usage

### Sync

It all starts with the primitive `Ok<T, E = never>` and `Err<T, E>` interfaces.

```typescript
type Invalid = 'invalid'

const ok = Result.Ok<string, Invalid>('{}')
const err = Result.Err<number, Invalid>('invalid')
```

A convinence `into` method is available when selecting either variant:

```typescript
const ok = Result.Ok('value').into<string>()

const fn: () => IResult<void, string> = () => {
  const err = Result.Err<number, string>('error')
  if (err.isErr()) {
    return err.into()
  }

  return Result.Ok(undefined)
}
```

Which can be used for parsing:

```typescript
const jsonparse = (input: string): IResult<unknown, SyntaxError> => {
  try {
    return Result.Ok(JSON.parse(input))
  } catch (error) {
    // Safety: MDN documentation states
    // that this is the only error to be thrown
    return Result.Err(error as SyntaxError)
  }
}
```


In general, any function can be transformed in this way:

```typescript
type JsonParse = (input: string) => IResult<unknown, unknown>

const jsonparse: JsonParse = Result.fromFn(JSON.parse)
```


But of course, the error is `unknown`, and this library will incrementally provide more wrapped APIs. Right now, you could also do:

```typescript
import {Globals} from 'stdresult'

const jsonparse = Globals.JSON.parse
```


These `Globals` always error out with a guarded type that states the Error class name:

```typescript
type NativeSyntaxError = {
  type: 'SyntaxError',
  error: SyntaxError
}
```

In this way errors can be summed like:

```typescript
import {Globals, NativeSyntaxError, NativeTypeError} from 'stdresult'

type E = NativeSyntaxError | NativeTypeError
const val = Globals.JSON.parse('invalid')
if (val.isErr() && val.error.type === 'SyntaxError') {
  console.assert(val.error.error instanceof SyntaxError)
}
```


The `type` field is a guard that does not require the error to enforce an `instanceof` check.

> All errors verify `instanceof Error` and extra
> care should be taken while verifying instances


Given an `IResult`, there are two guard functions with guarded fields:

- `.isOk()` --> `.value`
- `.isErr()` --> `.error`

```typescript
const val = Globals.JSON.parse('invalid')

if (val.isOk()) { // or val.isErr()
  console.log(val.value)
} else {
  console.error(val.error)
}
```


The rest of the story is just helper functions to chain and manipulate errors:

```typescript
import {Globals, Result, NativeSyntaxError} from 'stdresult'
import {z} from 'zod'

type Data = z.infer<typeof dataSchema>
type ParseError = {
  type: 'ZodError',
  error: unknown
}

const dataSchema = z.object({key: z.string()})

const res = Globals.JSON.parse('{"key":"value"}')
  .andThen((obj) =>
    Result.call(() => dataSchema.parse(obj))
      .mapErr((error) => ({
        type: 'ZodError' as const, error
      }))
  ) // res is IResult<Data, NativeSyntaxError | ParseError>
```


The last snippet shows how third-party libraries are generally part of the `unsafe` world. In the case of `zod`, a safe counterpart is available:

```typescript
import {Globals, Result, NativeSyntaxError} from 'stdresult'
import {z} from 'zod'

type Data = z.infer<typeof dataSchema>
type ParseError = {
  type: 'ZodError',
  error: z.ZodError<Data>
}

const dataSchema = z.object({key: z.string()})

const res = Globals.JSON.parse('{"key":"value"}')
  .andThen((obj) => {
    const result = dataSchema.safeParse(obj)
    if (!result.success) {
      return Result.Err({
        type: 'ZodError' as const,
        error: result.error
      })
    }

    return Result.Ok(result.data)
  })
```


In a way, the `safe` world extends from the bottom up. In the example, `zod` allows you to start deeper in the dependency tree.


### Async

The async counterpart of `IResult<T, E>` is `IAsyncResult<T, E>`.

Create from a `Promise` (pay the `unknown` price):

```typescript
// res is IAsyncResult<number, unknown>
const res = Result.fromPromise(Promise.resolve(42))
```


Or `defer` it as a `PromiseLike` interface:

```typescript
// res is IAsyncResult<number, string>
const res = Result.defer(Result.Ok(42))
  .andThen((v) => {
    if (v < 42) {
      return Result.defer(Result.Err<typeof v, string>('too low'))
    }

    return Result.defer(Result.Ok(v))
  })
```


In the `safe` world, `defer` replaces an `async` block.

## API


There are three main APIs/interfaces:

1. The `typeof Result` or `IResultCtor`
2. The `ResultExt`
3. The `AsyncResultExt`


Results are built via the static `Result` object:

```typescript
interface IResultCtor {
  /**
   * Builds a result from an error
   * @param error The error
   * @returns a result
   */
  Err: <T, E>(error: E) => IResult<T, E>
  /**
   * Builds a result from a value
   * @param value The value
   * @returns a result
   */
  Ok: <T, E = never>(value: T) => IResult<T, E>
  /**
   * Defers a result in a `PromiseLike` async result
   * @param r The result
   * @returns an async result
   */
  defer: <T, E>(r: IResult<T, E>) => IAsyncResult<T, E>
  /**
   * Builds an async result from a promise
   * @param p The promise
   * @returns an async result
   */
  fromPromise: <T>(p: Promise<T>) => IAsyncResult<T, unknown>
  /**
   * Builds a function returing a result from
   * a regular function
   * @param p The wrapped function
   * @returns a function returning a result
   */
  fromFn: <A extends any[], T>(p: (...arg: A) => T) =>
    (...args: A) => IResult<T, unknown>
  /**
   * Builds a function returing an async result from
   * a promise-valued function
   * @param p The wrapped function
   * @returns a function returning an async result
   */
  fromAsyncFn: <A extends any[], T>(p: (...args: A) => Promise<T>) =>
    (...args: A) => IAsyncResult<T, unknown>
  /**
   * Builds a result from a function
   * @param p The function
   * @returns a result
   */
  call: <T>(fn: () => T) => IResult<T, unknown>
  /**
   * Builds an async result from a function
   * @param p The function
   * @returns an async result
   */
  callAsync: <T>(fn: () => Promise<T>) => IAsyncResult<T, unknown>
  /**
   * Flattens a promised result into an async result
   * @param r The result
   * @returns an async result
   */
  flatten: <T, E>(r: Promise<IResult<T, E>>) => IAsyncResult<T, unknown>
  /**
   * Wraps a function returning a `Promise<IResult>` and
   * returns a function returning an `IAsyncResult`.
   * @param p The function
   * @returns a function returning an async result
   */
  flattenAsyncFn: <A extends any[], T, E>(p: (...args: A) => Promise<IResult<T, E>>) =>
    (...args: A) => IAsyncResult<T, unknown>
  /**
   * Wraps a function returning a `Promise<IResult>` and
   * returns an `IAsyncResult`.
   * @param p The function
   * @returns an async result
   */
  flattenCallAsync: <T, E>(p: () => Promise<IResult<T, E>>) => IAsyncResult<T, unknown>
}
```

A sync `IResult<T, E>` provides the following
methods:

```typescript
interface ResultExt<T, E> {
  /**
   * Returns `res` if the result is `Ok`, otherwise returns the `Err` value of `this`.
   */
  and<T2, E2 = E>(res: IResult<T2, E2 | E>): IResult<T2, E2 | E>
  /**
   * Calls `fn` if the result is `Ok`, otherwise returns the `Err` value of `this`.
   */
  andThen<T2, E2 = E>(fn: (value: T) => IResult<T2, E2 | E>): IResult<T2, E2 | E>
  /**
   * Returns the contained `Ok` value, consuming the self value.
   *
   * If the value is an `Err` then it throws an error with the provided message.
   */
  expect(msg: string): T
  /**
   * Returns the contained `Err` value, consuming the self value.
   *
   * If the value is an `Ok` then it throws an error with the provided message.
   */
  expectErr(msg: string): E
  /**
   * Taps the `Ok` value of the result. Useful for debugging and/or logging.
   *
   * WARNING: do not modify the value.
   */
  inspectOk(fn: (value: T) => void): IResult<T, E>
  /**
   * Taps the `Err` value of the result. Useful for debugging and/or logging.
   *
   * WARNING: do not modify the value.
   */
  inspectErr(fn: (error: E) => void): IResult<T, E>
  /**
   * Maps a `IResult<T, E>` to `IResult<T, F>` by applying a function to a
   * contained `Err` value, leaving an `Ok` value untouched.
   */
  mapErr<E2>(fn: (error: E) => E2): IResult<T, E2>
  /**
   * Maps a `IResult<T, E>` to `IResult<U, E>` by applying a function to a
   * contained `Ok` value, leaving an `Err` value untouched.
   */
  mapOk<T2>(fn: (value: T) => T2): IResult<T2, E>
  /**
   * Returns the provided default (if `Err`), or applies a function to the contained value (if `Ok`).
   */
  mapOr<T2>(or: T2, fn: (value: T) => T2): T2
  /**
   * Maps a `IResult<T, E>` to `T2` by applying fallback function default to a contained `Err` value,
   * or function `fn` to a contained `Ok` value.
   */
  mapOrElse<T2>(orFn: (error: E) => T2, fn: (value: T) => T2): T2
  /**
   * Returns `res` if the result is `Err`, otherwise returns the `Ok` value of `this`.
   */
  or<E2 = E>(res: IResult<T, E2 | E>): IResult<T, E2 | E>
  /**
   * Calls `fn` if the result is `Err`, otherwise returns the `Ok` value of `this`.
   */
  orElse<E2 = E>(fn: (error: E) => IResult<T, E2 | E>): IResult<T, E2 | E>
  /**
   * Returns the contained `Ok` value.
   *
   * WARNING: this function throws if called on an `Err<E>`.
   *
   * This is an example of a safe usage
   * @example
   * const result: IResult<number, string> = Result.Ok(42)
   * if (result.isOk()) {
   *   const value: number = result.unwrap() // safe
   * }
   */
  unwrap(): T
  /**
   * Returns the contained `Err` value.
   *
   * WARNING: this function throws if called on an `Ok<T>`.
   *
   * This is an example of a safe usage
   * @example
   * const result: IResult<number, string> = Result.Err('error')
   * if (result.isErr()) {
   *   const error: string = result.unwrapErr() // safe
   * }
   */
  unwrapErr(): E
  /**
   * Returns the contained Ok value or a provided default.
   */
  unwrapOr(or: T): T
  /**
   * Returns the contained Ok value or computes it from a closure.
   */
  unwrapOrElse(fn: (error: E) => T): T
}
```


An async `IAsyncResult<T, E>` provides the following methods:

```typescript
interface AsyncResultExt<T, E> {
  /**
   * Executes another future after this one resolves successfully.
   * The success value is passed to a closure to create this subsequent future.
   *
   * The provided `fn` will only be called if this future is resolved to an `Ok`.
  */
  andThen<T2, E2 = E>(
    fn: (value: T) => IResult<T2, E2 | E> | DeferResult<T2, E2 | E>,
  ): IAsyncResult<T2, E2 | E>
  /**
   * Taps the `Ok` value of the result. Useful for debugging and/or logging.
   *
   * WARNING: do not modify the value.
   */
  inspectOk(fn: (value: T) => void): IAsyncResult<T, E>
  /**
   * Taps the `Err` value of the result. Useful for debugging and/or logging.
   *
   * WARNING: do not modify the value.
   */
  inspectErr(fn: (error: E) => void): IAsyncResult<T, E>
  /**
   * Maps this future’s error value to a different value.
   */
  mapErr<E2>(fn: (error: E) => E2): IAsyncResult<T, E2>
  /**
   * Maps this future’s success value to a different value.
   */
  mapOk<T2>(fn: (value: T) => T2): IAsyncResult<T2, E>
  /**
   * Maps this future’s success value to a different value, and permits for error handling resulting in the same type.
   */
  mapOrElse<T2>(orFn: (error: E) => T2, fn: (value: T) => T2): PromiseLike<T2>
  /**
   * Returns the contained Ok value or computes it from a closure.
   */
  unwrapOrElse(fn: () => T): PromiseLike<T>
}
```

## Globals


To enrich platform methods and extend `safe` world coverage, this library provides alternative globals.

Currently `safe` versions are provided for:

- [x] `fetch`
- [x] `URL`
- [x] `JSON.parse`
- [x] `JSON.stringify`
- [ ] ...


> ⛪ Safety is hereby granted by the undisputed correctness of the MDN documentation.


Patterned error type safety is inferred with unsafe casts using MDN documentation recommendations and may therefore break on some platforms.

## Comparison with Rust traits


`IResult<T, E>` is roughly equivalent to `impl Result<T, E>` in Rust’s standard library, whereas `IAsyncResult<T, E>` implements `futures::future::TryFuture<Ok = T, Error = E>`.


Significant differences are:


- `mapOk` follows the naming of the `futures` library (it is `map` in `std::result::Result`).
- `andThen`, both on `IResult` and `IAsyncResult`, allows error mapping using the TS `or` operator (`|`): you can return from the closure any kind of error `E2`, which will be mapped to `E | E2`.
- `unwrap` and `unwrapErr` do not panic, but throw exceptions 🤐
- `mapOrElse` on `IAsyncResult` is aligned with `std::result::Result` naming instead of `futures::future::TryFutureExt`.

