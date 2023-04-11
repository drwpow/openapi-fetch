const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/** options for each client instance */
interface ClientOptions extends RequestInit {
  /** set the common root URL for all API requests */
  baseUrl?: string;
}

export interface BaseParams {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

export type Method = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';

/** Gets a union of paths which have method */
type PathsWith<T, M extends Method> = {
  [Path in keyof T]: T[Path] extends { [K in M]: unknown } ? Path : never;
}[keyof T];

type PathParams<T> = T extends { parameters: any } ? { params: T['parameters'] } : { params?: BaseParams };
type MethodParams<T> = T extends { parameters: any } ? { params: T['parameters'] } : { params?: BaseParams };
type Params<T> = PathParams<T> & MethodParams<T>;
type RequestBody<T> = T extends { requestBody: any } ? { body: Unwrap<T['requestBody']> } : { body?: never };
type FetchOptions<T> = Params<T> & RequestBody<T> & Omit<RequestInit, 'body'> & { querySerializer?: (query: any) => string };

type TruncatedResponse = Omit<Response, 'arrayBuffer' | 'blob' | 'body' | 'clone' | 'formData' | 'json' | 'text'>;
/** Infer request/response from content type */
type Unwrap<T> = T extends {
  content: { 'application/json': any };
}
  ? T['content']['application/json']
  : T extends { content: { 'application/json;charset=utf-8': any } }
  ? T['content']['application/json;charset=utf-8']
  : T extends { content: { '*/*': any } }
  ? T['content']['*/*']
  : T;

type Success<T> = T extends { 200: any } ? T[200] : T extends { 201: any } ? T[201] : T extends { 202: any } ? T[202] : T extends { default: any } ? T['default'] : unknown;
type Error<T> = T extends { 500: any }
  ? T[500]
  : T extends { 404: any }
  ? T[404]
  : T extends { 402: any }
  ? T[402]
  : T extends { 401: any }
  ? T[401]
  : T extends { 400: any }
  ? T[400]
  : T extends { 422: any }
  ? T[422]
  : T extends { 418: any }
  ? T[418]
  : T extends { 417: any }
  ? T[417]
  : T extends { 416: any }
  ? T[416]
  : T extends { 415: any }
  ? T[415]
  : T extends { 414: any }
  ? T[414]
  : T extends { 413: any }
  ? T[413]
  : T extends { 412: any }
  ? T[412]
  : T extends { 411: any }
  ? T[411]
  : T extends { 410: any }
  ? T[410]
  : T extends { 409: any }
  ? T[409]
  : T extends { 408: any }
  ? T[408]
  : T extends { 407: any }
  ? T[407]
  : T extends { 406: any }
  ? T[406]
  : T extends { 405: any }
  ? T[405]
  : T extends { default: any }
  ? T['default']
  : unknown;
type FetchResponse<T> =
  | {
      data: T extends { responses: any } ? NonNullable<Unwrap<Success<T['responses']>>> : unknown;
      error?: never;
      response: TruncatedResponse;
    }
  | {
      data?: never;
      error: T extends { responses: any } ? NonNullable<Unwrap<Error<T['responses']>>> : unknown;
      response: TruncatedResponse;
    };

export default function createClient<T>(options?: ClientOptions) {
  const defaultHeaders = new Headers({
    ...DEFAULT_HEADERS,
    ...(options?.headers ?? {}),
  });

  async function coreFetch<U extends keyof T, M extends keyof T[U]>(url: U, fetchOptions: FetchOptions<T[U][M]>): Promise<FetchResponse<T[U][M]>> {
    let { headers, body, params = {}, querySerializer = (q: any) => new URLSearchParams(q).toString(), ...init } = fetchOptions || {};

    // URL
    let finalURL = `${options?.baseUrl ?? ''}${url as string}`;
    const { path, query } = (params as BaseParams | undefined) ?? {};
    if (path) for (const [k, v] of Object.entries(path)) finalURL = finalURL.replace(`{${k}}`, encodeURIComponent(`${v}`.trim()));
    if (query) finalURL = `${finalURL}?${querySerializer(query as any)}`;

    // headers
    const baseHeaders = new Headers(defaultHeaders); // clone defaults (don’t overwrite!)
    const headerOverrides = new Headers(headers);
    for (const [k, v] of headerOverrides.entries()) {
      if (v === undefined || v === null) baseHeaders.delete(k); // allow `undefined` | `null` to erase value
      else baseHeaders.set(k, v);
    }

    // fetch!
    const res = await fetch(finalURL, {
      redirect: 'follow',
      ...options,
      ...init,
      headers: baseHeaders,
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
    const response: TruncatedResponse = {
      bodyUsed: res.bodyUsed,
      headers: res.headers,
      ok: res.ok,
      redirected: res.redirected,
      status: res.status,
      statusText: res.statusText,
      type: res.type,
      url: res.url,
    };
    return res.ok ? { data: res.status === 204 ? {} : await res.json(), response } : { error: await res.json(), response };
  }

  return {
    /** Call a GET endpoint */
    async get<U extends PathsWith<T, 'get'>, M extends keyof T[U]>(url: U, init: FetchOptions<T[U][M]>) {
      return coreFetch(url, { ...init, method: 'GET' } as any);
    },
    /** Call a PUT endpoint */
    async put<U extends PathsWith<T, 'put'>, M extends keyof T[U]>(url: U, init: FetchOptions<T[U][M]>) {
      return coreFetch(url, { ...init, method: 'PUT' } as any);
    },
    /** Call a POST endpoint */
    async post<U extends PathsWith<T, 'post'>, M extends keyof T[U]>(url: U, init: FetchOptions<T[U][M]>) {
      return coreFetch(url, { ...init, method: 'POST' } as any);
    },
    /** Call a DELETE endpoint */
    async del<U extends PathsWith<T, 'delete'>, M extends keyof T[U]>(url: U, init: FetchOptions<T[U][M]>) {
      return coreFetch(url, { ...init, method: 'DELETE' } as any);
    },
    /** Call a OPTIONS endpoint */
    async options<U extends PathsWith<T, 'options'>, M extends keyof T[U]>(url: U, init: FetchOptions<T[U][M]>) {
      return coreFetch(url, { ...init, method: 'OPTIONS' } as any);
    },
    /** Call a HEAD endpoint */
    async head<U extends PathsWith<T, 'head'>, M extends keyof T[U]>(url: U, init: FetchOptions<T[U][M]>) {
      return coreFetch(url, { ...init, method: 'HEAD' } as any);
    },
    /** Call a PATCH endpoint */
    async patch<U extends PathsWith<T, 'patch'>, M extends keyof T[U]>(url: U, init: FetchOptions<T[U][M]>) {
      return coreFetch(url, { ...init, method: 'PATCH' } as any);
    },
    /** Call a TRACE endpoint */
    async trace<U extends PathsWith<T, 'trace'>, M extends keyof T[U]>(url: U, init: FetchOptions<T[U][M]>) {
      return coreFetch(url, { ...init, method: 'TRACE' } as any);
    },
  };
}
