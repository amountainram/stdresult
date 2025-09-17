import { Result } from '../result.js';
import type { IAsyncResult } from '../types.js';
import { errorHandlers } from './utils.js';
import type { NativeTypeError, NativeDOMException } from './errors.js';

export type FetchArgs = Parameters<typeof globalThis.fetch>

export type FetchError =
  | { error: DOMException; type: 'AbortError' }
  | { error: DOMException; type: 'NotAllowedError' }
  | NativeTypeError

export const fetch = (...args: FetchArgs): IAsyncResult<Response, FetchError> =>
  Result.fromPromise(globalThis.fetch(...args))
    // SAFETY: MDN fetch documentation
    // <https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions>
    .mapErr<NativeDOMException | NativeTypeError>(errorHandlers.unsafeCatch)
    .mapErr<FetchError>((err) => {
      if (err.type === 'DOMException') {
        if (err.error.ABORT_ERR) {
          return { ...err, type: 'AbortError' as const }
        } else if (err.error.NO_DATA_ALLOWED_ERR) {
          return { ...err, type: 'NotAllowedError' as const }
        }

        // SAFETY: this should be unreachable
        // according to MDN fetch documentation
        // <https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions>
        throw err.error
      } else {
        return err
      }
    })
