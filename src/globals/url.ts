import { Result } from "../result.js"
import type { IResult } from "../types.js"
import { NativeTypeError } from "./errors.js"
import { errorHandlers } from "./utils.js"

export const URL = (
  ...args: ConstructorParameters<typeof globalThis.URL>
): IResult<URL, NativeTypeError> => {
  try {
    return Result.Ok(new globalThis.URL(...args))
  } catch (err: unknown) {
    // SAFETY: MDN URL ctor documentation
    // <https://developer.mozilla.org/en-US/docs/Web/API/URL/URL#exceptions>
    return Result.Err(errorHandlers.unsafeCatch(err))
  }
}
