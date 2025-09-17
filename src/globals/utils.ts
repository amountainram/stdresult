import type { NativeError } from './errors.js'

const errorHandlers = {
  catch: (
    error: unknown
  ): NativeError | { error: unknown; type: 'unknown' } => {
    if (error instanceof TypeError) {
      return { error, type: 'TypeError' }
    }

    if (error instanceof SyntaxError) {
      return { error, type: 'SyntaxError' }
    }

    if (error instanceof EvalError) {
      return { error, type: 'EvalError' }
    }

    if (error instanceof RangeError) {
      return { error, type: 'RangeError' }
    }

    if (error instanceof ReferenceError) {
      return { error, type: 'ReferenceError' }
    }

    if (error instanceof URIError) {
      return { error, type: 'URIError' }
    }

    if (error instanceof DOMException) {
      return { error, type: 'DOMException' }
    }

    // WARNING: This must be the last check
    // because all custom errors extend the Error class
    if (error instanceof Error) {
      return { error, type: 'Error' }
    }

    return { error, type: 'unknown' }
  },
  /**
   * UNSAFE cast to an error in a descriptive form
   * with a `type` field and the error instance
   * @param error the caught error
   * @returns the casted error
   */
  unsafeCatch: <E extends { error: unknown; type: string }>(
    error: unknown
  ): E => {
    const nativeError = errorHandlers.catch(error)
    if (nativeError.type === 'unknown') {
      throw nativeError.error
    }

    return nativeError as E
  },
}

export { errorHandlers }
