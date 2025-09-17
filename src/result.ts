import type {
  Ok,
  Err,
  ResultImpl,
  IResult,
  IAsyncResult,
  DeferResult,
} from './types.js'

export interface IResultCtor {
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
  fromFn: <T>(p: () => T) => () => IResult<T, unknown>
  /**
   * Builds a function returing an async result from
   * a promise-valued function
   * @param p The wrapped function
   * @returns a function returning an async result
   */
  fromAsyncFn: <T>(p: () => Promise<T>) => () => IAsyncResult<T, unknown>
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
}

const implementExt = <T, E>(
  ctor: IResultCtor, result: ResultImpl<T, E> & (Ok<T> | Err<E>)
): IResult<T, E> => {
  const iface = {
    and<T2, E2 = E>(res: IResult<T2, E2 | E>): IResult<T2, E2 | E> {
      if (result.isOk()) {
        return res
      }

      return ctor.Err(result.error)
    },
    andThen<T2, E2 = E>(
      fn: (value: T) => IResult<T2, E2 | E>
    ): IResult<T2, E2 | E> {
      if (result.isOk()) {
        return fn(result.value)
      }

      return ctor.Err(result.error)
    },
    expect(msg: string) {
      if (result.isOk()) {
        return result.value
      }

      const error = new TypeError(msg)
      Object.defineProperty(error, 'cause', { value: result.error })
      throw error
    },
    expectErr(msg: string) {
      if (result.isErr()) {
        return result.error
      }

      const error = new TypeError(msg)
      Object.defineProperty(error, 'cause', { value: result.value })
      throw error
    },
    inspectOk(fn: (value: T) => void): IResult<T, E> {
      if (result.isOk()) {
        fn(result.value)
        return ctor.Ok(result.value)
      }

      return ctor.Err(result.error)
    },
    inspectErr(fn: (error: E) => void): IResult<T, E> {
      if (result.isErr()) {
        fn(result.error)
        return ctor.Err(result.error)
      }

      return ctor.Ok(result.value)
    },
    mapErr<E2>(fn: (error: E) => E2): IResult<T, E2> {
      if (result.isOk()) {
        return ctor.Ok(result.value)
      }

      return ctor.Err(fn(result.error))
    },
    mapOk<T2>(fn: (value: T) => T2): IResult<T2, E> {
      if (result.isOk()) {
        return ctor.Ok(fn(result.value))
      }

      return ctor.Err(result.error)
    },
    mapOr<T2>(or: T2, fn: (value: T) => T2): T2 {
      if (result.isOk()) {
        return fn(result.value)
      }

      return or
    },
    mapOrElse<T2>(orFn: (error: E) => T2, fn: (value: T) => T2): T2 {
      if (result.isOk()) {
        return fn(result.value)
      }

      return orFn(result.error)
    },
    or<E2 = E>(res: IResult<T, E2 | E>): IResult<T, E2 | E> {
      if (result.isErr()) {
        return res
      }

      return ctor.Ok(result.value)
    },
    orElse<E2 = E>(fn: (error: E) => IResult<T, E2 | E>): IResult<T, E2 | E> {
      if (result.isErr()) {
        return fn(result.error)
      }

      return ctor.Ok(result.value)
    },
    unwrap() {
      if (result.isOk()) {
        return result.value
      }

      const error = new TypeError(
        'Result is error',
      )
      Object.defineProperty(error, 'cause', { value: result.error })
      throw error
    },
    unwrapErr() {
      if (result.isErr()) {
        return result.error
      }

      const error = new TypeError(
        'Result is ok',
      )
      Object.defineProperty(error, 'cause', { value: result.value })
      throw error
    },
    unwrapOr(or: T): T {
      if (result.isOk()) {
        return result.value
      }

      return or
    },
    unwrapOrElse(fn: (error: E) => T): T {
      if (result.isOk()) {
        return result.value
      }

      return fn(result.error)
    }
  }

  return Object.assign(result, iface)
}

const implementAsyncExt = <T, E>(
  ctor: IResultCtor, result: DeferResult<T, E>
): IAsyncResult<T, E> => {
  const iface = {
    andThen<T2, E2 = E>(
      fn: (value: T) => IResult<T2, E2 | E> | DeferResult<T2, E | E>
    ): IAsyncResult<T2, E2 | E> {
      return implementAsyncExt(
        Result,
        result.then((result) => {
          if (result.isOk()) {
            return fn(result.value)
          }

          return ctor.Err(result.error)
        })
      )
    },
    inspectOk(fn: (value: T) => void): IAsyncResult<T, E> {
      return implementAsyncExt(Result, result.then((inner) => inner.inspectOk(fn)))
    },
    inspectErr(fn: (error: E) => void): IAsyncResult<T, E> {
      return implementAsyncExt(Result, result.then((inner) => inner.inspectErr(fn)))
    },
    mapErr<E2>(fn: (error: E) => E2): IAsyncResult<T, E2> {
      return implementAsyncExt(Result, result.then((inner) => inner.mapErr(fn)))
    },
    mapOk<T2>(fn: (value: T) => T2): IAsyncResult<T2, E> {
      return implementAsyncExt(Result, result.then((inner) => inner.mapOk(fn)))
    },
    mapOrElse<T2>(orFn: (error: E) => T2, fn: (value: T) => T2): PromiseLike<T2> {
      return result.then((inner) => inner.mapOrElse(orFn, fn))
    },
    unwrapOrElse(fn: (error: E) => T): PromiseLike<T> {
      return result.then((inner) => inner.unwrapOrElse(fn))
    }
  }

  return Object.assign(Promise.resolve(result), iface)
}

/**
 * Constructs an error `IResult`.
 * @param error The error value to wrap in the result.
 * @returns A Result representing failure with the given error.
 * @example
 * const result = Result.Err("Something went wrong");
 * if (result.isErr()) {
 *   console.error(result.error);
 * }
 */
const Err = <T, E>(error: E): IResult<T, E> => {
  const result: ResultImpl<T, E> = {
    isErr: (): this is Err<E> => true,
    isOk: (): this is Ok<T> => false,
  }
  const rImpl = Object.defineProperty(
    result, 'error', { get: () => error }
  ) as ResultImpl<T, E> & Err<E>

  return implementExt(Result, rImpl)
}

/**
 * Constructs a successful `IResult`.
 * @param value The value to wrap in the result.
 * @returns A Result representing success with the given value.
 * @example
 * const result = Result.Ok(42);
 * if (result.isOk()) {
 *   console.log(result.value);
 * }
 */
const Ok = <T, E>(value: T): IResult<T, E> => {
  const result = {
    isErr: (): this is Err<E> => false,
    isOk: (): this is Ok<T> => true,
  }
  const rImpl = Object.defineProperty(
    result, 'value', { get: () => value }
  ) as ResultImpl<T, E> & Ok<T>

  return implementExt(Result, rImpl)
}

/**
 * Converts a regular `IResult` or a deferred result
 * like `Promise<IResult>` into a promised `IAsyncResult`.
 * @param r A Result or a DeferResult (Promise of Result).
 * @returns An IAsyncResult that resolves to the given result.
 * @example
 * const asyncResult = Result.defer(Result.Ok(123));
 * asyncResult.then(r => {
 *   if (r.isOk()) console.log(r.error);
 * });
 */
const defer = <T, E>(r: IResult<T, E>): IAsyncResult<T, E> =>
  implementAsyncExt(Result, Promise.resolve(r))

/**
 * Wraps a promise to return an `IAsyncResult`.
 * Since promises reject an unknown error type,
 * the error type in the resulting `IAsyncResult` is `unknown`.
 * @param promise A promise to wrap.
 * @returns An IAsyncResult that resolves to Ok(value) or Err(error).
 * @example
 * const asyncResult = Result.fromPromise(fetchData());
 * asyncResult.then(r => {
 *   if (r.isOk()) console.log(r.value);
 *   else console.error(r.error);
 * });
 */
const fromPromise = <T>(promise: Promise<T>) =>
  implementAsyncExt(Result, new Promise<IResult<T, unknown>>((resolve) => {
    promise
      .then((value) => resolve(Result.Ok(value)))
      .catch((error) => resolve(Result.Err(error as unknown)))
  }))

/**
 * Wraps a potentially throwing function and returns `IResult`.
 * the error type in the resulting `IResult` is `unknown`.
 * @param fn A function that may throw.
 * @returns A function that cannot throw and returns an IResult.
 * @example
 * const fn = Result.fromFn(() => JSON.parse('invalid JSON'));
 * const r = fn();
 *
 * if (r.isOk()) console.log(r.value);
 * else console.error(r.error);
 */
const fromFn = <T>(fn: () => T) => () => {
  try {
    return Result.Ok<T, unknown>(fn())
  } catch (error) {
    return Result.Err<T, unknown>(error)
  }
}

/**
 * Wraps a potentially throwing function and returns `IResult`.
 * the error type in the resulting `IResult` is `unknown`.
 * @param fn A function that may throw.
 * @returns An IResult that resolves to Ok(value) or Err(error).
 * @example
 * const r = Result.fromFn(() => JSON.parse('invalid JSON'));
 *
 * if (r.isOk()) console.log(r.value);
 * else console.error(r.error);
 */
const call = <T>(fn: () => T) => fromFn(fn)()

/**
 * Wraps a function returning a function that resolves to a
 * promise, cannot throws, and returns `IAsyncResult`.
 * @param fn An async function to wrap.
 * @returns An IAsyncResult that resolves to Ok(value) or Err(error).
 * @example
 * const asyncResult = Result.fromAsyncFn(() => fetch('https://example.com'));
 * asyncResult.then(r => {
 *   if (r.isOk()) console.log(r.value);
 *   else console.error(r.error);
 * });
 */
const fromAsyncFn = <T>(fn: () => Promise<T>) => () => fromPromise(fn())

/**
 * Wraps a function returning an `IAsyncResult`.
 * @param fn An async function to wrap.
 * @returns An IAsyncResult that resolves to Ok(value) or Err(error).
 * @example
 * const asyncResult = Result.callAsync(() => fetch('https://example.com'));
 * asyncResult.then(r => {
 *   if (r.isOk()) console.log(r.value);
 *   else console.error(r.error);
 * });
 */
const callAsync = <T>(fn: () => Promise<T>) => fromAsyncFn(fn)()

/**
 * `Result` is a namespace that provides construction
 * functions Ok/Err structures.
 *
 * Functions:
 * - Ok: Constructs a successful result.
 * - Err: Constructs an error result.
 * - defer: Converts a regular `IResult` into a promised `IAsyncResult`.
 * - fromPromise: Wraps a promise to return a `IAsyncResult`.
 * - fromFn: Wraps a function that may throw and returns a `IResult`.
 * - fromAsyncFn: Wraps an async function and returns a `IAsyncResult`.
 */
const Result: IResultCtor = {
  Err,
  Ok,
  defer,
  fromPromise,
  fromFn,
  fromAsyncFn,
  call,
  callAsync
}

export {
  Err,
  Ok,
  defer,
  fromPromise,
  fromFn,
  fromAsyncFn,
  call,
  callAsync,
  Result
}
