import { atom, computed } from 'nanostores';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
// @ts-expect-error
import createFetchMock from 'vitest-fetch-mock';
import createClient from './index.js';
import type { paths } from '../test/v1.js';

const fetchMocker = createFetchMock(vi);

beforeAll(() => {
  fetchMocker.enableMocks();
});
afterEach(() => {
  fetchMocker.resetMocks();
});

describe('createClient', () => {
  it('generates all proper functions', () => {
    const client = createClient<paths>();

    expect(client).toHaveProperty('get');
    expect(client).toHaveProperty('put');
    expect(client).toHaveProperty('post');
    expect(client).toHaveProperty('del');
    expect(client).toHaveProperty('options');
    expect(client).toHaveProperty('head');
    expect(client).toHaveProperty('patch');
    expect(client).toHaveProperty('trace');
  });

  it('marks data as undefined, but never both', async () => {
    const client = createClient<paths>();

    // data
    fetchMocker.mockResponseOnce(JSON.stringify(['one', 'two', 'three']));
    const dataRes = await client.get('/string-array', {});

    // … is initially possibly undefined
    // @ts-expect-error
    expect(dataRes.data[0]).toBe('one');

    // … is present if error is undefined
    if (!dataRes.error) {
      expect(dataRes.data[0]).toBe('one');
    }

    // … means data is undefined
    if (dataRes.data) {
      // @ts-expect-error
      expect(() => dataRes.error.message).toThrow();
    }

    // error
    fetchMocker.mockResponseOnce(() => ({
      status: 500,
      body: JSON.stringify({ status: '500', message: 'Something went wrong' }),
    }));
    const errorRes = await client.get('/string-array', {});

    // … is initially possibly undefined
    // @ts-expect-error
    expect(errorRes.error.message).toBe('Something went wrong');

    // … is present if error is undefined
    if (!errorRes.data) {
      expect(errorRes.error.message).toBe('Something went wrong');
    }

    // … means data is undefined
    if (errorRes.error) {
      // @ts-expect-error
      expect(() => errorRes.data[0]).toThrow();
    }
  });

  it('respects baseUrl', async () => {
    const client = createClient<paths>({ baseUrl: 'https://myapi.com/v1' });
    fetchMocker.mockResponse(JSON.stringify({ message: 'OK' }));
    await client.get('/self', {});
    expect(fetchMocker.mock.calls[0][0]).toBe('https://myapi.com/v1/self');
  });

  it('preserves default headers', async () => {
    const headers: HeadersInit = { Authorization: 'Bearer secrettoken' };

    const client = createClient<paths>({ headers });
    fetchMocker.mockResponseOnce(JSON.stringify({ email: 'user@user.com' }));
    await client.get('/self', {});

    // assert default headers were passed
    const options = fetchMocker.mock.calls[0][1];
    expect(options?.headers).toEqual(
      new Headers({
        ...headers, // assert new header got passed
        'Content-Type': 'application/json', //  probably doesn’t need to get tested, but this was simpler than writing lots of code to ignore these
      })
    );
  });

  it('allows override headers', async () => {
    const client = createClient<paths>({ headers: { 'Cache-Control': 'max-age=10000000' } });
    fetchMocker.mockResponseOnce(JSON.stringify({ email: 'user@user.com' }));
    await client.get('/self', { headers: { 'Cache-Control': 'no-cache' } });

    // assert default headers were passed
    const options = fetchMocker.mock.calls[0][1];
    expect(options?.headers).toEqual(
      new Headers({
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
      })
    );
  });
});

describe('get()', () => {
  it('sends the correct method', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.get('/' as any, {});
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('GET');
  });

  it('sends correct options, returns success', async () => {
    const mockData = { title: 'My Post', body: '<p>This is a very good post</p>', publish_date: new Date('2023-03-01T12:00:00Z').getTime() };
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: JSON.stringify(mockData) }));
    const { data, error, response } = await client.get('/post/{post_id}', {
      params: { path: { post_id: 'my-post' } },
    });

    // assert correct URL was called
    expect(fetchMocker.mock.calls[0][0]).toBe('/post/my-post');

    // assert correct data was returned
    expect(data).toEqual(mockData);
    expect(response.status).toBe(200);

    // assert error is empty
    expect(error).toBe(undefined);
  });

  it('sends correct options, returns error', async () => {
    const mockError = { code: 404, message: 'Post not found' };
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 404, body: JSON.stringify(mockError) }));
    const { data, error, response } = await client.get('/post/{post_id}', {
      params: { path: { post_id: 'my-post' } },
    });

    // assert correct URL was called
    expect(fetchMocker.mock.calls[0][0]).toBe('/post/my-post');

    // assert correct method was called
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('GET');

    // assert correct error was returned
    expect(error).toEqual(mockError);
    expect(response.status).toBe(404);

    // assert data is empty
    expect(data).toBe(undefined);
  });

  it('escapes URLs properly', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.get('/post/{post_id}', {
      params: { path: { post_id: 'post?id = 🥴' } },
    });

    // expect post_id to be encoded properly
    expect(fetchMocker.mock.calls[0][0]).toBe('/post/post%3Fid%20%3D%20%F0%9F%A5%B4');
  });
});

describe('post()', () => {
  it('sends the correct method', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.post('/' as any, {});
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('POST');
  });

  it('sends correct options, returns success', async () => {
    const mockData = { status: 'success' };
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 201, body: JSON.stringify(mockData) }));
    const { data, error, response } = await client.post('/create-post', {
      body: {
        title: 'New Post',
        body: '<p>Best post yet</p>',
        publish_date: new Date('2023-03-31T12:00:00Z').getTime(),
      },
    });

    // assert correct URL was called
    expect(fetchMocker.mock.calls[0][0]).toBe('/create-post');

    // assert correct data was returned
    expect(data).toEqual(mockData);
    expect(response.status).toBe(201);

    // assert error is empty
    expect(error).toBe(undefined);
  });

  it('supports sepecifying utf-8 encoding', async () => {
    const mockData = { message: 'My reply' };
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 201, body: JSON.stringify(mockData) }));
    const { data, error, response } = await client.post('/create-reply', {
      body: {
        message: 'My reply',
        replied_at: new Date('2023-03-31T12:00:00Z').getTime(),
      },
    });

    // assert correct URL was called
    expect(fetchMocker.mock.calls[0][0]).toBe('/create-reply');

    // assert correct data was returned
    expect(data).toEqual(mockData);
    expect(response.status).toBe(201);

    // assert error is empty
    expect(error).toBe(undefined);
  });

  it('supports optional requestBody', async () => {
    const mockData = { status: 'success' };
    const client = createClient<paths>();
    fetchMocker.mockResponse(() => ({ status: 201, body: JSON.stringify(mockData) }));

    // assert omitting `body` doesn’t raise a TS error (testing the response isn’t necessary)
    await client.post('/create-tag/{name}', {
      params: { path: { name: 'New Tag' } },
    });

    // assert providing `body` with correct schema doesn’t raise a TS error
    await client.post('/create-tag/{name}', {
      params: { path: { name: 'New Tag' } },
      body: { description: 'This is a new tag' },
    });

    // assert providing `body` with bad schema WILL raise a TS error
    await client.post('/create-tag/{name}', {
      params: { path: { name: 'New Tag' } },
      // @ts-expect-error
      body: { foo: 'Bar' },
    });
  });

  it('returns empty object on 204', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 204, body: '' }));
    const { data, error, response } = await client.post('/create-tag/{name}', {
      params: { path: { name: 'New Tag' } },
      body: { description: 'This is a new tag' },
    });

    // assert correct URL was called
    expect(fetchMocker.mock.calls[0][0]).toBe('/create-tag/New%20Tag');

    // assert correct data was returned
    expect(data).toEqual({});
    expect(response.status).toBe(204);

    // assert error is empty
    expect(error).toBe(undefined);
  });
});

describe('delete()', () => {
  it('sends the correct method', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.del('/' as any, {});
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('DELETE');
  });

  it('returns empty object on 204', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 204, body: '' }));
    const { data, error, response } = await client.del('/post/{post_id}', {
      params: { path: { post_id: '123' } },
    });

    // assert correct URL was called
    expect(fetchMocker.mock.calls[0][0]).toBe('/post/123');

    // assert correct data was returned
    expect(data).toEqual({});
    expect(response.status).toBe(204);

    // assert error is empty
    expect(error).toBe(undefined);
  });
});

describe('options()', () => {
  it('sends the correct method', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.options('/' as any, {});
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('OPTIONS');
  });
});

describe('head()', () => {
  it('sends the correct method', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.head('/' as any, {});
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('HEAD');
  });
});

describe('patch()', () => {
  it('sends the correct method', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.patch('/' as any, {});
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('PATCH');
  });
});

describe('trace()', () => {
  it('sends the correct method', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.trace('/' as any, {});
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('TRACE');
  });
});

// test that the library behaves as expected inside commonly-used patterns
describe('examples', () => {
  it('nanostores', async () => {
    const token = atom<string | undefined>();
    const client = computed([token], (currentToken) => createClient<paths>({ headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {} }));

    // assert initial call is unauthenticated
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.get().get('/post/{post_id}', { params: { path: { post_id: '1234' } } });
    expect(fetchMocker.mock.calls[0][1].headers.get('authorization')).toBeNull();

    // assert after setting token, client is authenticated
    const tokenVal = 'abcd';
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        token.set(tokenVal); // simulate promise-like token setting
        resolve();
      }, 0)
    );
    await client.get().get('/post/{post_id}', { params: { path: { post_id: '1234' } } });
    expect(fetchMocker.mock.calls[1][1].headers.get('authorization')).toBe(`Bearer ${tokenVal}`);
  });

  it('proxies', async () => {
    let token: string | undefined = undefined;

    const baseClient = createClient<paths>();
    const client = new Proxy(baseClient, {
      get(_, key: keyof typeof baseClient) {
        const newClient = createClient<paths>({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
        return newClient[key];
      },
    });

    // assert initial call is unauthenticated
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.get('/post/{post_id}', { params: { path: { post_id: '1234' } } });
    expect(fetchMocker.mock.calls[0][1].headers.get('authorization')).toBeNull();

    // assert after setting token, client is authenticated
    const tokenVal = 'abcd';
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await new Promise<void>((resolve) =>
      setTimeout(() => {
        token = tokenVal; // simulate promise-like token setting
        resolve();
      }, 0)
    );
    await client.get('/post/{post_id}', { params: { path: { post_id: '1234' } } });
    expect(fetchMocker.mock.calls[1][1].headers.get('authorization')).toBe(`Bearer ${tokenVal}`);
  });
});
