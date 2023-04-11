# 🎾 openapi-fetch

Ultra-fast fetching for TypeScript generated automatically from your OpenAPI schema. Weighs in at **1 kb** and has virtually zero runtime. Works with React, Vue, Svelte, or vanilla JS.

| Library                        | Size (min) |
| :----------------------------- | ---------: |
| **openapi-fetch**              |     `1 kB` |
| **openapi-typescript-fetch**   |     `4 kB` |
| **openapi-typescript-codegen** | `345 kB`\* |

\* _Note: codegen depends on the scope of your API: the larger it is, the larger your client weight. This is the actual weight of GitHub’s REST API client._

The syntax is inspired by popular libraries like react-query or Apollo client, but without all the bells and whistles and in a 1 kb package.

```ts
import createClient from 'openapi-fetch';
import { paths } from './v1'; // (generated from openapi-typescript)

const { get, post } = createClient<paths>();

// Type-checked request

await post('/create-post', {
  body: {
    title: 'My New Post',
    // ❌ Property 'publish_date' is missing in type …
  },
});

// Type-checked response

const { data, error } = await get('/post/my-blog-post');

console.log(data.title); // ❌ 'data' is possibly 'undefined'
console.log(error.message); // ❌ 'error' is possibly 'undefined'
console.log(data?.foo); // ❌ Property 'foo' does not exist on type …
```

Notice **there are no generics, and no manual typing.** Your endpoint’s exact request & response was inferred automatically off the URL. This makes a **big difference** in the type safety of your endpoints! This eliminates all of the following:

- ✅ No malformed URLs
- ✅ Always using the correct method
- ✅ All parameters are fully type-checked and matched the schema
- ✅ For POST and PATCH, etc., all request bodies are fully type-checked as well
- ✅ No chance the wrong type was manually imported
- ✅ No chance typing was bypassed altogether
- ✅ All of this in a **1 kB** client package 🎉

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
  },
});
```

## 🏓 Usage

Using **openapi-fetch** is as easy as reading your schema! For example, given the following schema:

```yaml
# v1.yaml
paths:
  /post/{post_id}:
    get:
      parameters:
        - in: path
          name: post_id
          required: true
        - in: query
          name: version
      responses:
        200: #…
        404: #…
  /create-post:
    post:
      requestBody:
        required: true
        schema:
          content:
            application/json:
              type: object
              properties:
                title:
                  type: string
                body:
                  type: string
                publish_date:
                  type: number
              required:
                - title
                - body
                - publish_date
      responses:
        200: #…
        500: #…
```

Here’s how you’d query either endpoint:

```ts
import createClient from 'openapi-fetch';
import { paths } from './v1';

const { get, post } = createClient<paths>();

// GET /post/{post_id}
const { data, error } = await get('/post/{post_id}', {
  params: {
    path: { post_id: 'my-post' },
    query: { version: 2 },
  },
});

// POST /create-post
const { data, error } = await post('/create-post', {
  body: {
    title: 'New Post',
    body: '<p>New post body</p>',
    publish_date: new Date('2023-03-01T12:00:00Z').getTime(),
  },
});
```

Note in the `get()` example, the URL was actually `/post/{post_id}`, _not_ `/post/my-post`. The URL matched the OpenAPI schema definition rather than the final URL. This library will replace the path param correctly for you, automatically.

### 🔒 Handling Auth

Authentication often requires some reactivity dependent on a token. Since this library is so low-level, there are myriad ways to handle it:

#### Nano Stores

Here’s how it can be handled using [nanostores](https://github.com/nanostores/nanostores), a tiny (334 b), universal signals store:

```ts
// src/lib/api/index.ts
import { atom, computed } from 'nanostores';
import createClient from 'openapi-fetch';
import { paths } from './v1';

export const authToken = atom<string | undefined>();
someAuthMethod().then((newToken) => authToken.set(newToken));

export const client = computed(authToken, (currentToken) =>
  createClient<paths>({
    headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
  })
);

// src/some-other-file.ts
import { client } from './lib/api';

const { get, post } = client.get();

get('/some-authenticated-url', {
  /* … */
});
```

#### Vanilla JS Proxies

You can also use [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which are now supported in all modern browsers:

```ts
// src/lib/api/index.ts
import createClient from 'openapi-fetch';
import { paths } from './v1';

let authToken: string | undefined = undefined;
someAuthMethod().then((newToken) => (authToken = newToken));

const client = createClient<paths>();

export default new Proxy(client, {
  get(target, key) {
    const newClient = createClient<paths>({ headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} });
    return (newClient as any)[key];
  },
});

// src/some-other-file.ts
import client from './lib/api';

client.get('/some-authenticated-url', {
  /* … */
});
```

## 🎛️ Config

`createClient()` accepts the following options, which set the default settings for all subsequent fetch calls.

| Name      |   Type   | Description                             |
| :-------- | :------: | :-------------------------------------- |
| `baseUrl` | `string` | Prefix all fetch URLs with this option. |

In addition, you may pass any other [fetch options](https://developer.mozilla.org/en-US/docs/Web/API/fetch) such as `headers`, `mode`, `credentials`, `redirect`, etc. ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch)).

## 🧙‍♀️ Advanced

### Caching

By default, this library does **NO** caching of any kind (it’s **1 kb**, remember?). However, this library can be easily wrapped using any method of your choice, while still providing strong typechecking for endpoints.

### Differences from openapi-typescript-fetch

This library is identical in purpose to [openapi-typescript-fetch](https://github.com/ajaishankar/openapi-typescript-fetch), but has the following differences:

- This library has a built-in `error` type for `3xx`/`4xx`/`5xx` errors whereas openapi-typescript-fetch throws exceptions (requiring you to wrap things in `try/catch`)
- This library has a more terse syntax (`get(…)`) wheras openapi-typescript-fetch requires chaining (`.path(…).method(…).create()`)
- openapi-typescript-fetch supports middleware whereas this library doesn’t

### Status Code Polymorphism

This library assumes that your API returns one “good” status at `200`, `201`, or `default`, and one “bad” status at `500`, `404`, or `default`. Returning multiple “good” and “bad” statuses for the same endpoint isn’t currently supported.
