# Contributing

Thanks for being willing to contribute! 🙏

**Working on your first Pull Request (PR)?** [Egghead has a great free video introduction](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

## Open issues

Please check out the [the open issues](https://github.com/drwpow/openapi-fetch/issues). Issues labelled [**Help Wanted**](https://github.com/drwpow/openapi-fetch/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) and [**Good First Issue**](https://github.com/drwpow/openapi-fetch/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) are especially good to help with.

Contributing doesn’t have to be in code! Simply answering questions in open issues, or providing workarounds, is just as important a contribution as making pull requests.

## Setup

### Dependencies

1. Install [pnpm](https://pnpm.io/)
2. Fork and clone the repo
3. Run `pnpm i` to install dependencies
4. Create a branch for your PR with `git checkout -b pr/your-branch-name`

## Testing

This library uses [Vitest](https://vitest.dev/) for testing. There’s a great [VS Code extension](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer) you can optionally use if you’d like in-editor debugging tools.

### Running tests

💡 The tests test **the production build** in `dist/`. Be sure to run `npm run build` before running tests (or keep `npm run dev` running in the background, which compiles as-you-work)!

To run the entire test suite once, run:

```bash
npm test
```

To run an individual test:

```bash
npx vitest [partial filename]
```

To start the entire test suite in watch mode:

```bash
npx vitest
```
