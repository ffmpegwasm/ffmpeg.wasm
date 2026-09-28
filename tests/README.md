# Tests

```sh
pnpm test                          # everything
pnpm test --project core-st        # one project: core-st, core-mt, browser-st, browser-mt
pnpm test tests/core/exec          # files under a path
```

- `tests/core/`: `@ffmpeg/core` itself, in Node.js.
- `tests/ffmpeg/`, `tests/util/`: `@ffmpeg/ffmpeg` and `@ffmpeg/util` in Chromium ([Vitest browser mode](https://vitest.dev/guide/browser/)).
- `tests/helpers/`: fixtures (`core`, `ffmpeg`, `dir`) and small helpers.

Nothing is mocked: tests run the real wasm and fetch from a local server.
`test.fails` marks a known bug; it starts failing once the bug is fixed.
