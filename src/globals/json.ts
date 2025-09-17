import { Result } from '../result.js'
import type { IResult } from '../types.js'
import type { NativeSyntaxError, NativeTypeError } from './errors.js'
import { errorHandlers } from './utils.js'

export const JSON = {
  parse: (
    ...args: Parameters<typeof globalThis.JSON.parse>
  ): IResult<unknown, NativeSyntaxError> => {
    try {
      return Result.Ok(globalThis.JSON.parse(...args))
    } catch (err: unknown) {
      // SAFETY: MDN JSON.parse documentation
      // <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#exceptions>
      return Result.Err(errorHandlers.unsafeCatch(err))
    }
  },
  stringify: (
    ...args: Parameters<typeof globalThis.JSON.stringify>
  ): IResult<string, NativeTypeError> => {
    try {
      return Result.Ok(globalThis.JSON.stringify(...args))
    } catch (err: unknown) {
      // SAFETY: MDN JSON.stringify documentation
      // <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#exceptions>
      return Result.Err(errorHandlers.unsafeCatch(err))
    }
  },
}
