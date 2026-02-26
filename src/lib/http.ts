import type { RequestEventBase } from '@builder.io/qwik-city';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, message: string, code = 'api_error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function assert(condition: unknown, status: number, message: string, code?: string): asserts condition {
  if (!condition) {
    throw new ApiError(status, message, code);
  }
}

export async function parseJsonBody(event: RequestEventBase): Promise<unknown> {
  try {
    return await event.request.json();
  } catch {
    throw new ApiError(400, 'Invalid JSON body', 'invalid_json');
  }
}

type JsonResponder = {
  json: (status: number, data: unknown) => void;
};

export function sendApiError(event: JsonResponder, error: unknown) {
  // Qwik redirect errors can carry circular references in dev mode.
  // Re-throw redirect responses so the framework handles them natively.
  if (typeof error === 'object' && error !== null) {
    const maybe = error as { status?: unknown; statusCode?: unknown };
    const status = typeof maybe.status === 'number' ? maybe.status : typeof maybe.statusCode === 'number' ? maybe.statusCode : null;
    if (status !== null && status >= 300 && status < 400) {
      throw error;
    }
  }

  if (error instanceof ApiError) {
    event.json(error.status, {
      ok: false,
      error: {
        code: error.code,
        message: error.message
      }
    });
    return;
  }

  event.json(500, {
    ok: false,
    error: {
      code: 'internal_error',
      message: 'An unexpected server error occurred.'
    }
  });
}
