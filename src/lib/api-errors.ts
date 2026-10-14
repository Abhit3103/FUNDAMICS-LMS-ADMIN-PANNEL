/**
 * API Error handling utilities.
 * Parses FastAPI / FUNDAMICS backend error responses safely.
 * SECURITY: Never expose raw stack traces or internal errors to users.
 */

export interface ApiErrorDetail {
  /** HTTP status code */
  status: number;
  /** User-safe error message */
  message: string;
  /** Field-level validation errors (422 responses) */
  fieldErrors?: Record<string, string[]>;
  /** Original error code from backend, if available */
  code?: string;
}

/**
 * FastAPI validation error shape:
 * { detail: [{ loc: [...], msg: "...", type: "..." }] }
 */
interface FastApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface FastApiErrorBody {
  detail?: string | FastApiValidationError[] | unknown;
  message?: string;
  code?: string;
}

/**
 * Extract a user-safe message from a backend error response body.
 * Never returns raw stack traces or internal implementation details.
 */
export function parseApiError(
  status: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseData: any
): ApiErrorDetail {
  const body = responseData as FastApiErrorBody | null | undefined;

  // 422 Unprocessable Entity — FastAPI validation errors
  if (status === 422 && body?.detail && Array.isArray(body.detail)) {
    const fieldErrors: Record<string, string[]> = {};
    for (const err of body.detail as FastApiValidationError[]) {
      const field = err.loc.filter((l) => l !== 'body').join('.');
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(err.msg);
    }
    return {
      status,
      message: 'Please correct the highlighted fields.',
      fieldErrors,
    };
  }

  // Standard detail string
  if (body?.detail && typeof body.detail === 'string') {
    return {
      status,
      message: body.detail,
      code: body.code,
    };
  }

  // Fallback messages per status code
  const fallbacks: Record<number, string> = {
    400: 'The request was invalid. Please check your input.',
    401: 'Your session has expired. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred. The record may already exist.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'An unexpected server error occurred. Please try again later.',
    502: 'The server is temporarily unavailable. Please try again.',
    503: 'The service is currently unavailable. Please try again later.',
  };

  return {
    status,
    message: fallbacks[status] ?? 'An unexpected error occurred.',
    code: body?.code,
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly fieldErrors?: Record<string, string[]>;
  public readonly code?: string;

  constructor(detail: ApiErrorDetail) {
    super(detail.message);
    this.name = 'ApiError';
    this.status = detail.status;
    this.fieldErrors = detail.fieldErrors;
    this.code = detail.code;
  }
}
