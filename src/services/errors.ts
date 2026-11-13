/** Thrown when input is invalid (e.g. an empty title). The message is safe to show to users. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/** Thrown when a record to read, update, or delete does not exist. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/** Turns any thrown value into a readable message. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'An unknown error occurred.';
}

/** Trims text and checks it is non-empty and not too long. Returns the trimmed text. */
export function requireText(value: string, fieldName: string, maxLength: number): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) {
    throw new ValidationError(`${fieldName} cannot be empty.`);
  }
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

/** Like requireText, but empty text is allowed. */
export function optionalText(value: string | undefined, fieldName: string, maxLength: number): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return trimmed;
}

/** Checks that an id is a positive whole number. */
export function requireId(id: number, label: string): number {
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`Invalid ${label} id.`);
  }
  return id;
}
