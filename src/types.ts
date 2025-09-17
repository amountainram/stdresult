export interface Err<E> {
  error: E
}

export interface Ok<T> {
  value: T
}

export interface ResultImpl<T, E> {
  isErr(): this is Err<E>
  isOk(): this is Ok<T>
}

export interface ResultExt<T, E> {
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

export interface AsyncResultExt<T, E> {
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

/**
 * Type wrapping an Ok or an Err result.
 * `IResult<T, E>` has 3 main interfaces:
 *
 * - `ResultImpl<T, E>` that peeks the type of the result and infers typings
 * - `Ok<T> | Err<E>` that can be picked using `ResultImpl`
 * - `ResultExt<T, E>` that provides utility methods to work with the result like chaining or mapping
 *
 * Example of usage:
 *
 * - crate a bare `IResult`:
 *
 * ```typescript
 * import { Result } from 'stdresult'
 *
 * const ok = Result.Ok<number, unknown>(42)
 * if (ok.isOk()) {
 *   console.log('The answer is', ok.value)
 * }
 *
 * const err = Result.Err<unknown, string>('Something went wrong')
 * if (err.isErr()) {
 *   console.error('Error:', err.error)
 * }
 * ```
 *
 * - use `andThen` to chain results:
 *
 * ```typescript
 * import { Result } from 'stdresult'
 *
 * const parseNumber = (s: string): IResult<number, string> => {
 *   const n = Number.parseInt(s)
 *   if (Number.isNaN(n)) {
 *     return Result.Err(`Cannot parse "${s}" as number`)
 *   }
 *
 *   return Result.Ok(n)
 * }
 *
 * const op = Result.Ok<number, string>('42')
 *   .andThen(parseNumber)
 * if (op.isOk()) {
 *   console.log('The answer is', op.value)
 * }
 * ```
 *
 * - unsafe `unwrap` (which is actually safe at compile time):
 *
 * ```typescript
 * import { Result } from 'stdresult'
 *
 * console.log('The answer is', Result.Ok<number, string>(42).unwrap())
 * ```
 */
export type IResult<T, E> = ResultImpl<T, E> & ResultExt<T, E> & (Ok<T> | Err<E>)

export type IAsyncResult<T, E> = DeferResult<T, E> & AsyncResultExt<T, E>

export type DeferResult<T, E> = PromiseLike<IResult<T, E>>
