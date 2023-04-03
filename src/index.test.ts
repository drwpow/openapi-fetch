import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import createClient from './index.js';
import { paths } from '../test/v1';

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
});

describe('delete()', () => {
  it('sends the correct method', async () => {
    const client = createClient<paths>();
    fetchMocker.mockResponseOnce(() => ({ status: 200, body: '{}' }));
    await client.del('/' as any, {});
    expect(fetchMocker.mock.calls[0][1]?.method).toBe('DELETE');
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
