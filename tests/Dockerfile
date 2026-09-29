# Runs `pnpm test` (unit, Node.js and end-to-end tests) in Playwright's image:
#   pnpm test:docker
# packages/core/dist must hold a built core (pnpm build:wasm).
FROM mcr.microsoft.com/playwright:v1.63.0-noble
WORKDIR /repo
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
CMD ["pnpm", "test"]
