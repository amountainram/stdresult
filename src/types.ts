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

interface ResultExt<T, E> {
  andThen<T2, E2 = E>(fn: (value: T) => IResult<T2, E2 | E>): IResult<T2, E2 | E>
  expect(msg: string): T
  mapErr<E2>(fn: (error: E) => E2): IResult<T, E2>
  mapOk<T2>(fn: (value: T) => T2): IResult<T2, E>
  inspectOk(fn: (value: T) => void): IResult<T, E>
  inspectErr(fn: (error: E) => void): IResult<T, E>
  unwrap(): T
}

interface AsyncResultExt<T, E> {
  andThen<T2, E2 = E>(
    fn: (value: T) => IResult<T2, E2 | E> | DeferResult<T2, E2 | E>,
  ): IAsyncResult<T2, E2 | E>
  mapErr<E2>(fn: (error: E) => E2): IAsyncResult<T, E2>
  mapOk<T2>(fn: (value: T) => T2): IAsyncResult<T2, E>
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
