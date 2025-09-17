import { Globals, Result } from 'stdresult'
import { test, expect } from 'vitest'
import z from 'zod'

test('Globals.JSON.parse', () => {
  const res = Globals.JSON.parse('{"key":"value"}')

  if (res.isOk()) {
    expect(res.value).toEqual({ key: 'value' })
  } else {
    throw new Error('Expected Ok result')
  }

  const resErr = Globals.JSON.parse('invalid JSON')
  if (resErr.isErr()) {
    expect(resErr.error).toHaveProperty('type', 'SyntaxError')
  } else {
    throw new Error('Expected Err result')
  }
})

test('Globals.JSON.parse and validate with zod', () => {
  type Data = z.infer<typeof schema>

  const schema = z.object({ key: z.string() })

  const result = Globals.JSON.parse('{"key":"value"}')
    .andThen((data) =>
      Result.call(() => schema.parse(data))
        .mapErr((err) => ({ type: 'ZodError' as const, error: err }))
    )

  if (result.isOk()) {
    expect(result.value).toEqual({ key: 'value' } as Data)
  } else {
    throw new Error('Expected Ok result')
  }
})

test('Async Globals.JSON.parse and validate with zod', async () => {
  type Data = z.infer<typeof schema>

  const schema = z.object({ key: z.string() })

  const result = await Result.defer(Globals.JSON.parse('{"key":"value"}'))
    .andThen((data) =>
      Result.callAsync(() => schema.parseAsync(data))
        .mapErr((err) => ({ type: 'ZodError' as const, error: err }))
    )

  if (result.isOk()) {
    expect(result.value).toEqual({ key: 'value' } as Data)
  } else {
    throw new Error('Expected Ok result')
  }
})

test('URL constructor', () => {
  const res = Globals.URL('https://example.com/path?query=123#hash')
  if (res.isOk()) {
    expect(res.value).toBeInstanceOf(URL)
    expect(res.value.href).toBe('https://example.com/path?query=123#hash')
  } else {
    throw new Error('Expected Ok result')
  }

  const resErr = Globals.URL('invalid-url')
  if (resErr.isErr()) {
    expect(resErr.error).toHaveProperty('type', 'TypeError')
  } else {
    throw new Error('Expected Err result')
  }
})

test('fetch abort error', async () => {
  const controller = new AbortController()
  const res = Globals.fetch('https://example.com', { signal: controller.signal })
  controller.abort()

  const resErr = await res
  if (resErr.isErr()) {
    expect(resErr.error).toHaveProperty('type', 'AbortError')
  } else {
    throw new Error('Expected Err result')
  }
})

test('fetch ok', async () => {
  const res = await Globals.fetch('https://example.com')
  if (res.isOk()) {
    expect(res.value).toBeInstanceOf(Response)
    expect(res.value.status).toBe(200)
  } else {
    throw new Error('Expected Ok result')
  }
})
