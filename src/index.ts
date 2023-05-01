// settings
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/** options for each client instance */
interface ClientOptions extends RequestInit {
  /** set the common root URL for all API requests */
  baseUrl?: string;
}
export interface BaseParams {
  params?: { query?: Record<string, unknown> };
}

// const
export type HttpMethod = 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
export type OkStatus = 200 | 201 | 202 | 203 | 204 | 206 | 207;
export type ErrorStatus = 500 | 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 420 | 421 | 422 | 423 | 424 | 425 | 426 | 429 | 431 | 444 | 450 | 451 | 497 | 498 | 499;

// util
/** Get a union of paths which have method */
export type PathsWith<Paths extends {}, PathnameMethod extends HttpMethod> = {
  [Pathname in keyof Paths]: Paths[Pathname] extends { [K in PathnameMethod]: any } ? Pathname : never;
}[keyof Paths];
/** Find first match of multiple keys */
export type FilterKeys<Obj, Matchers> = { [K in keyof Obj]: K extends Matchers ? Obj[K] : never }[keyof Obj];
/** handle "application/json", "application/vnd.api+json", "appliacation/json;charset=utf-8" and more */
export type JSONLike = `${string}json${string}`;

// fetch types
export type Params<OperationObj> = OperationObj extends { parameters: any } ? { params: OperationObj['parameters'] } : BaseParams;
export type RequestBodyObj<OperationObj> = FilterKeys<OperationObj, 'requestBody'>;
export type RequestBodyContent<OperationObj> = undefined extends RequestBodyObj<OperationObj> ? FilterKeys<NonNullable<RequestBodyObj<OperationObj>>, 'content'> | undefined : FilterKeys<RequestBodyObj<OperationObj>, 'content'>;
export type RequestBodyJSON<OperationObj> = FilterKeys<RequestBodyContent<OperationObj>, JSONLike> extends never
  ? FilterKeys<NonNullable<RequestBodyContent<OperationObj>>, JSONLike> | undefined
  : FilterKeys<RequestBodyContent<OperationObj>, JSONLike>;
export type RequestBody<OperationObj> = undefined extends RequestBodyJSON<OperationObj> ? { body?: RequestBodyJSON<OperationObj> } : { body: RequestBodyJSON<OperationObj> };
export type QuerySerializer<OperationObj> = { querySerializer?: (query: OperationObj extends { parameters: { query: any } } ? OperationObj['parameters']['query'] : Record<string, unknown>) => string };
export type FetchOptions<OperationObj> = Params<OperationObj> & RequestBody<OperationObj> & Omit<RequestInit, 'body'> & QuerySerializer<OperationObj>;
export type Success<OperationObj> = FilterKeys<FilterKeys<OperationObj, OkStatus>, 'content'>;
export type Error<OperationObj> = FilterKeys<FilterKeys<OperationObj, ErrorStatus>, 'content'>;
export type FetchResponse<T> =
  | { data: T extends { responses: any } ? NonNullable<FilterKeys<Success<T['responses']>, JSONLike>> : unknown; error?: never; response: Response }
  | { data?: never; error: T extends { responses: any } ? NonNullable<FilterKeys<Error<T['responses']>, JSONLike>> : unknown; response: Response };

export default function createClient<Paths extends {}>(options?: ClientOptions) {
  const defaultHeaders = new Headers({
    ...DEFAULT_HEADERS,
    ...(options?.headers ?? {}),
  });

  async function coreFetch<Pathname extends keyof Paths, PathnameMethod extends keyof Paths[Pathname]>(url: Pathname, fetchOptions: FetchOptions<Paths[Pathname][PathnameMethod]>): Promise<FetchResponse<Paths[Pathname][PathnameMethod]>> {
    let { headers, body: requestBody, params = {}, querySerializer = (q: QuerySerializer<Paths[Pathname][PathnameMethod]>) => new URLSearchParams(q as any).toString(), ...init } = fetchOptions || {};

    // URL
    let finalURL = `${options?.baseUrl ?? ''}${url as string}`;
    if ((params as any).path) {
      for (const [k, v] of Object.entries((params as any).path)) finalURL = finalURL.replace(`{${k}}`, encodeURIComponent(String(v)));
    }
    if ((params as any).query && Object.keys((params as any).query).length) {
      finalURL += `?${querySerializer((params as any).query)}`;
    }

    // headers
    const baseHeaders = new Headers(defaultHeaders); // clone defaults (don’t overwrite!)
    const headerOverrides = new Headers(headers);
    for (const [k, v] of headerOverrides.entries()) {
      if (v === undefined || v === null) baseHeaders.delete(k); // allow `undefined` | `null` to erase value
      else baseHeaders.set(k, v);
    }

    // fetch!
    const response = await fetch(finalURL, {
      redirect: 'follow',
      ...options,
      ...init,
      headers: baseHeaders,
      body: typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody),
    });

    // don’t parse JSON if status is 204, or Content-Length is '0'
    const body = response.status === 204 || response.headers.get('Content-Length') === '0' ? {} : await response.json();
    return response.ok ? { data: body, response } : { error: body, response: response };
  }

  return {
    /** Call a GET endpoint */
    async get<Pathname extends PathsWith<Paths, 'get'>>(url: Pathname, init: FetchOptions<FilterKeys<Paths[Pathname], 'get'>>) {
      return coreFetch(url, { ...init, method: 'GET' } as any);
    },
    /** Call a PUT endpoint */
    async put<Pathname extends PathsWith<Paths, 'put'>>(url: Pathname, init: FetchOptions<FilterKeys<Paths[Pathname], 'put'>>) {
      return coreFetch(url, { ...init, method: 'PUT' } as any);
    },
    /** Call a POST endpoint */
    async post<Pathname extends PathsWith<Paths, 'post'>>(url: Pathname, init: FetchOptions<FilterKeys<Paths[Pathname], 'post'>>) {
      return coreFetch(url, { ...init, method: 'POST' } as any);
    },
    /** Call a DELETE endpoint */
    async del<Pathname extends PathsWith<Paths, 'delete'>>(url: Pathname, init: FetchOptions<FilterKeys<Paths[Pathname], 'delete'>>) {
      return coreFetch(url, { ...init, method: 'DELETE' } as any);
    },
    /** Call a OPTIONS endpoint */
    async options<Pathname extends PathsWith<Paths, 'options'>>(url: Pathname, init: FetchOptions<FilterKeys<Paths[Pathname], 'options'>>) {
      return coreFetch(url, { ...init, method: 'OPTIONS' } as any);
    },
    /** Call a HEAD endpoint */
    async head<Pathname extends PathsWith<Paths, 'head'>>(url: Pathname, init: FetchOptions<FilterKeys<Paths[Pathname], 'head'>>) {
      return coreFetch(url, { ...init, method: 'HEAD' } as any);
    },
    /** Call a PATCH endpoint */
    async patch<Pathname extends PathsWith<Paths, 'patch'>>(url: Pathname, init: FetchOptions<FilterKeys<Paths[Pathname], 'patch'>>) {
      return coreFetch(url, { ...init, method: 'PATCH' } as any);
    },
    /** Call a TRACE endpoint */
    async trace<Pathname extends PathsWith<Paths, 'trace'>>(url: Pathname, init: FetchOptions<FilterKeys<Paths[Pathname], 'trace'>>) {
      return coreFetch(url, { ...init, method: 'TRACE' } as any);
    },
  };
}
