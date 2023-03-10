# 🎾 openapi-fetch

Ultra-fast, paper-thin `fetch()` wrapper for vanilla JS generated from your OpenAPI types. Weights in at < **1 kb** and has virtually ZERO runtime. Works with React, Vue, Svelte, or vanilla JS.

```ts
import createClient from 'openapi-fetch';
import { paths } from './v1'; // (generated from openapi-typescript)

const { get, post } = createClient<paths>();

// Validate request

// ❌ Property 'publish_date' is missing in type …
await post('/create-post', {
  body: {
    title: 'My New Post',
  },
});
// ✅
await post('/create-post', {
  body: {
    title: 'My New Post',
    publish_date: '2023-02-04T14:23:23Z',
  },
});

// Validate response

const { data, error } = await get('/post/my-blog-post');

// ❌ 'data' is possibly 'undefined'
console.log(data.title);
// ❌ 'error' is possibly 'undefined'
console.log(error.message);

// ✅
if (data) {
  console.log(data.title);  My Blog Post
} else {
  console.log(error.message);
}
```

## 🔧 Setup

First install this package and [openapi-typescript](https://github.com/drwpow/openapi-typescript) from npm:

```
npm i -D openapi-fetch openapi-typescript
```

Next, generate TypeScript types from your OpenAPI schema using openapi-typescript:

```
npx openapi-typescript ./path/to/api/v1.yaml -o ./src/lib/api/v1.d.ts
```

_Note: be sure to [validate](https://apitools.dev/swagger-cli/) your schema first! openapi-typescript will err on invalid schemas._

Lastly, create the client while configuring default options:

```ts
import createClient from 'openapi-fetch';
import { paths } from './v1'; // (generated from openapi-typescript)

const { get, post, put, patch, del } = createClient<paths>({
  baseURL: 'https://myserver.com/api/v1/',
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_AUTH_TOKEN}`,
    Connection: 'keep-alive',
    'Content-Type': 'application/json',
  },
});
```

## 🏓 Usage

`createClient()` returns an object with `get()`, `put()`, `post()`, `del()`, `options()`, `head()`, `patch()`, and `trace()` methods that correspond to the valid [HTTP methods OpenAPI supports](https://spec.openapis.org/oas/latest.html#path-item-object) (with the notable change of `delete` to `del` because the former is a reserved word in JavaScript).

```ts
import createClient from 'openapi-fetch';
import { paths } from './v1'; // (generated from openapi-typescript)

const { get, put, post, del, options, head, patch, trace } = createClient<paths>();
```

To use `parameters`, pass a `params: { query: { … }, path: { … }}` object as the second param. You may provide `query` (search params) or `path` parameters, depending on what your endpoint requires:

```ts
// GET /users?order_by=name_asc
await get('/users', { params: { query: { order_by: 'name_asc' } } });

// GET /project/my_project
await get('/project/{project_id}', {
  params: { path: { project_name: 'my_project' } },
});
```

To pass a `body`, do it the same as you would with `fetch()`, minus `JSON.stringify()` so it can be typechecked:

```ts
// POST /new-user
await post('/new-user', {
  body: {
    name: 'New User',
    email: 'new@email.com',
  },
});
```

You may also pass any other [fetch options](https://developer.mozilla.org/en-US/docs/Web/API/fetch) you’d like in the 2nd param, such as custom `headers`, [abort signals](https://developer.mozilla.org/en-US/docs/Web/API/fetch#signal), etc.:

```ts
const ac = new AbortController();
await get('/projects', {
  headers: {
    'x-custom-header': true,
  },
  signal: ac.signal,
});
```

Lastly, every function will return a promise that **resolves** with either `data` or `error`, but never both (follows best practices instituted by [GraphQL](https://www.apollographql.com/) and libraries like [react-query](https://tanstack.com/query):

```ts
const { data, error, response } = await get('/my-endpoint');
if (data) {
  // { data: { [my schema type] }, error: undefined }
} else {
  // { data: undefined, error: { [my error type] } }
}
```

## 🎛️ Config

`createClient()` accepts the following options, which set the default settings for all subsequent fetch calls.

| Name      |   Type   | Description                             |
| :-------- | :------: | :-------------------------------------- |
| `baseUrl` | `string` | Prefix all fetch URLs with this option. |

In addition, you may pass any other [fetch options](https://developer.mozilla.org/en-US/docs/Web/API/fetch) such as `headers`, `mode`, `credentials`, `redirect`, etc. ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch)).

## 🧙‍♀️ Advanced

### Caching

By default, this library does **NO** caching of any kind (it’s < **1 kb**, remember?). However, this library can be easily wrapped using any method of your choice, while still providing strong typechecking for endpoints.

### Status Code Polymorphism

This library assumes that your API returns one “good” status at `200`, `201`, or `default`, and one “bad” status at `500`, `404`, or `default`. Returning different shapes based on API status isn’t yet supported by this library, but may be in an upcoming version (please add a ticket with your valid OpenAPI schema).
