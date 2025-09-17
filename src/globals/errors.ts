export type NativeTypeError = {
  error: TypeError
  type: 'TypeError'
}

export type NativeSyntaxError = {
  error: SyntaxError
  type: 'SyntaxError'
}

export type NativeDOMException = {
  error: DOMException
  type: 'DOMException'
}

export type NativeEvalError = {
  error: EvalError
  type: 'EvalError'
}

export type NativeRangeError = {
  error: RangeError
  type: 'RangeError'
}

export type NativeReferenceError = {
  error: ReferenceError
  type: 'ReferenceError'
}

export type NativeURIError = {
  error: URIError
  type: 'URIError'
}

export type NativeError =
  | { error: Error; type: 'Error' }
  | NativeTypeError
  | NativeSyntaxError
  | NativeEvalError
  | NativeRangeError
  | NativeReferenceError
  | NativeURIError
  | NativeDOMException
