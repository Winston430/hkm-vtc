export class TimeoutError extends Error {
  constructor(message = 'timeout') {
    super(message)
    this.name = 'TimeoutError'
  }
}

export class UploadError extends Error {
  constructor(message = 'upload') {
    super(message)
    this.name = 'UploadError'
  }
}

/** Rejects with `onTimeout()` (or TimeoutError) if `promise` doesn't settle within `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number, onTimeout?: () => Error): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(onTimeout ? onTimeout() : new TimeoutError()), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>
}