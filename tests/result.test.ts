import { NativeSyntaxError, NativeTypeError, Result } from 'stdresult'
import { test, expect } from 'vitest'
import { errorHandlers } from '@utils'

test('Result.Ok', () => {
  const ok = Result.Ok<number, string>(42)
  if (ok.isOk()) {
    expect(ok.value).toBe(42)
  } else {
    throw new Error('Expected Ok result')
  }
})

test('Result.Err', () => {
  const ok = Result.Err<unknown, unknown>(new TypeError('err'))
  if (ok.isErr()) {
    expect(ok.error).toBeInstanceOf(TypeError)
  } else {
    throw new Error('Expected Err result')
  }
})

test('Result.mapOk', () => {
  const res = Result.Ok<number, string>(42)
    .mapOk((value) => value + 1)

  if (res.isOk()) {
    expect(res.value).toBe(43)
  } else {
    throw new Error('Expected Ok result')
  }

  const resErr = Result.Err<number, TypeError>(new TypeError('err'))
    .mapOk((value) => value + 1)

  if (resErr.isErr()) {
    expect(resErr.error).toBeInstanceOf(TypeError)
  } else {
    throw new Error('Expected Err result')
  }
})

test('Result.mapErr', () => {
  const res = Result.Ok<number, TypeError>(42)
    .mapErr((err) => new SyntaxError(err.message))

  if (res.isOk()) {
    expect(res.value).toBe(42)
  } else {
    throw new Error('Expected Ok result')
  }

  const resErr = Result.Err<number, TypeError>(new TypeError('err'))
    .mapErr((err) => new SyntaxError(err.message))

  if (resErr.isErr()) {
    expect(resErr.error).toBeInstanceOf(SyntaxError)
  } else {
    throw new Error('Expected Err result')
  }
})

test('Result.andThen', () => {
  const op = Result.call(() => JSON.parse('{"key": "value"}'))
    .mapErr<NativeSyntaxError>(errorHandlers.unsafeCatch)

  if (op.isOk()) {
    expect(op.value).toBeTypeOf('object')
  } else {
    throw new Error('Expected Ok result')
  }

  const opErr = Result.call(() => JSON.parse('invalid json'))
    .mapErr<NativeSyntaxError>(errorHandlers.unsafeCatch)

  if (opErr.isErr()) {
    expect(opErr.error).toHaveProperty('type', 'SyntaxError')
  } else {
    throw new Error('Expected Err result')
  }
})

test('IAsyncResult andThen', async () => {
  const op = await Result.callAsync(() => fetch('https://google.com'))
    .andThen((res) => Result.fromPromise(res.json()))
    .mapErr<NativeSyntaxError>(errorHandlers.unsafeCatch)

  if (op.isErr()) {
    expect(op.error).toHaveProperty('type', 'SyntaxError')
  } else {
    throw new Error('Expected Err result')
  }
})

test('IAsyncResult mapErr', async () => {
  const op = await Result.callAsync(() => fetch('google.com'))
    .mapErr<NativeTypeError>(errorHandlers.unsafeCatch)

  if (op.isErr()) {
    expect(op.error).toHaveProperty('type', 'TypeError')
  } else {
    throw new Error('Expected Err result')
  }
})
