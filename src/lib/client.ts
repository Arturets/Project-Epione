export type ApiResponse<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };

export async function fetchApi<T>(input: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok && payload.ok) {
    return {
      ok: false,
      error: {
        code: 'request_failed',
        message: 'Request failed'
      }
    };
  }

  return payload;
}

export function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString();
}
