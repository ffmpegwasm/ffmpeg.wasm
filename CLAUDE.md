# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working with code in this repository under **WSL2 (Ubuntu)** on Windows.

---

## 1. INSTRUCTION HIERARCHY & CONFLICT RESOLUTION

When instructions conflict, follow this precedence order:

1. **Project/repository context** (existing code, architecture decisions)
2. **This CLAUDE.md file** (repository-specific guidelines)
3. **User's current message** (immediate requirements)
4. **General best practices** (fallback defaults)

**Ambiguity handling**: If requirements are ambiguous **and correctness depends on clarification**, ask **one** precise question. Otherwise, state your explicit assumption and proceed.

---

## 2. TECHNICAL ENVIRONMENT CONTEXT (WSL)

<ENVIRONMENT>
- **Host OS**: Windows 11
- **Dev environment**: **WSL2** (Ubuntu 22.04+), **bash** shell
- **Pathing**: Use **Linux paths** (`/home/<user>/project`). Avoid `/mnt/c/...` for performance.
- **Line endings**: **LF**
- **Tool/version manager**: **mise** (not nvm)
  - Pin tools in `.mise.toml`. Use `mise install` to sync versions.
  - Activate in shell: `eval "$(mise activate bash)"` (put in `~/.bashrc`).
  - Set Node: `mise use -g node@lts`
- **Package manager**: **pnpm** via Corepack (pinned through mise Node): `corepack enable && corepack prepare pnpm@latest --activate`
- **Node execution**: Prefer `pnpm` scripts (e.g., `pnpm dev`, `pnpm test`) or `npx` for one-offs.
- **Languages present**: TypeScript and C; **only modify TypeScript** unless explicitly requested.
- **Docker**: Required. Use **Docker Desktop for Windows** with **WSL2 integration enabled** for your distro. Validate with `docker info` inside WSL.
- **Environment variables**: Secrets in `.env` (inaccessible). Schema documented in `.env.example`.
- **Browser dev**: When serving in WSL, apps are reachable from Windows at `http://localhost:<port>`.
</ENVIRONMENT>

**WSL setup (quick start)**

```bash
# mise
curl -fsSL https://mise.jdx.dev/install.sh | sh
# activate for current shell (and add to ~/.bashrc for persistence)
~/.local/bin/mise --version
export PATH="$HOME/.local/bin:$PATH"
eval "$(~/.local/bin/mise activate bash)"

# Node via mise + pnpm via Corepack
mise use -g node@lts
mise install
corepack enable
corepack prepare pnpm@latest --activate

# Essentials
sudo apt-get update && sudo apt-get install -y build-essential git curl

# Docker (requires Docker Desktop with WSL integration enabled)
docker --version || true
docker info  # should succeed inside WSL
```

---

## 3. CORE CODING PRINCIPLES

<PRINCIPLES>
**Philosophy**
- Strive for simplicity and exceptional DX
- **Avoid overengineering and premature optimization**
- Follow the existing project style and conventions
- Prioritize docs over theories

**Architecture & Structure**

* Prefer **functional programming** over OOP
* Follow **SRP** (Single Responsibility Principle)
* Apply **DRY**
* Prioritize **readability over raw performance**
* When you don't have knowledge of library versions being used, retrieve latest docs from context7

**Code Quality Standards**

* Write correct, best-practice, fully functional code
* Include **all** required imports and dependencies
* Ensure code is production-ready
* Follow language-specific idioms

**Up-to-date Docs**

* Use project context and official docs for latest stable guides

  </PRINCIPLES>

---

## 4. ABSOLUTE COMPLETENESS REQUIREMENTS

<COMPLETENESS>
**Critical delivery standard**: Provide **complete, working** code (no placeholders).

**Complete code means**:

* ✅ Full file contents (no partials)
* ✅ All imports & deps
* ✅ Proper error handling (no "// handle error")
* ✅ Input validation
* ✅ Edge cases addressed
* ✅ Helpful inline docs
* ❌ No TODOs / placeholders / omissions

**Verification before delivery**: Code must be runnable on first attempt within WSL. </COMPLETENESS>

---

## 5. CODE QUALITY GATES (WSL)

<QUALITY_GATES>
**This repository is a library with TypeScript and C sources; only TypeScript will be modified.**

**Install & sync tool versions**

```bash
mise install
pnpm install
```

**Node.js / TypeScript**

```bash
# Linting
pnpm run lint

# Type checking
pnpm exec tsc --noEmit

# Tests
pnpm test
```

**Docker (required)**

* Ensure Docker is reachable in WSL: `docker info`
* If the repo provides Docker artifacts (e.g., a CI image or examples), they **must build**:

```bash
# Example CI image build (adjust Dockerfile path/name if the repo differs)
docker build -t project-ci -f Dockerfile.ci .
```

**Minimum requirements**: Linting, formatting, type-checking must pass. Include at least one smoke test demonstrating core functionality works (see §11).

**Runbook (deliver with code)**

* Installation commands (new dependencies)
* Commands to verify code quality
* Commands to run tests and any Docker builds
  </QUALITY_GATES>

---

## 6. STRUCTURED PROBLEM-SOLVING APPROACH

<REASONING>
**For complex tasks** (multi-step logic, algorithmic problems, architectural changes) apply **SCoT**:

1. **Analyze** the problem (flow, branches, loops, edge cases)
2. **Plan** the approach step-by-step
3. **Identify** pitfalls and mitigations
4. **Implement** per plan
5. **Verify** all requirements are met

**For architectural changes**:

1. Current architecture
2. Proposed change
3. Affected components
4. Potential breaking changes
5. Migration path

   </REASONING>

---

## 7. INTERACTION PROTOCOL

<INTERACTION>
**Communication style**
- Be concise and direct
- Focus on technical substance
- Do not apologize for following instructions
- Do not thank—execute
- Do not repeat the prompt unless asked

**Providing code**

* Deliver complete, working code (see Section 4)
* Use proper markdown code blocks with language tags
* Include file paths as comments when relevant

**Code review feedback**

* Be specific to the code
* Provide actionable suggestions with concrete examples
* Focus on security, performance, maintainability, architecture

**When uncertain**

* If unknown: say so directly
* If no single correct answer: explain why
* If making assumptions: state them explicitly

**Safeguards**

* ⚠️ Do **not** break existing code unless explicitly asked
* ⚠️ Do **not** remove existing comments unless explicitly asked
* ⚠️ Do **not** remove existing functionality when modifying code

  </INTERACTION>

---

## 8. SELF-VERIFICATION PROTOCOL (WSL)

<VERIFICATION>
Before delivering any code, verify:

✅ **mise synced**: `mise install` completes without errors
✅ **Deps install**: `pnpm install` succeeds
✅ **Docker available**: `docker info` works inside WSL
✅ **Entry points run**: `pnpm dev`/`pnpm build`/`pnpm test` as applicable
✅ **Linux paths only**: No Windows-only path assumptions; avoid `/mnt/c` for active workspaces
✅ **Smoke test passes**: Core ffmpeg.wasm pipeline succeeds (see §11)
✅ **Static checks pass**: Lint, format, types
✅ **Completeness achieved**: No placeholders/TODOs
✅ **Env vars validated**: Required env vars checked at startup (if used) </VERIFICATION>

---

## 9. PROJECT-SPECIFIC NOTES: ffmpeg.wasm–style repos

* **Languages**: TypeScript (primary), C sources present but **do not modify C** unless explicitly asked.
* **Runtime targets**: Browser and/or Node.js. Avoid Node-only APIs when browser support is intended.
* **Asset loading**: Ensure ffmpeg.wasm core files (wasm, worker, JS bridge) are served from a **public/static** path. Base URL must be configurable.
* **Memory & large files**: Document memory limits; prefer chunked/streaming approaches where possible. Consider wasm memory config if supported by the library.
* **Workers & headers**: If using multithreaded builds, dev server must emit COOP/COEP headers. Provide a single-thread fallback.
* **Virtual FS**: In-browser file I/O is in-memory; persist via Blob downloads or user-provided handles. Keep Node parity where shared.
* **DX**: Wrap raw ffmpeg commands with typed helpers; log stderr on failure with actionable guidance.
* **Docker usage**: If examples/tests rely on containerized build or tooling, provide a `Dockerfile.ci` (or equivalent) and a `pnpm` script to build/run it from WSL.

**Example smoke test (TypeScript)**

```ts
// tests/smoke.ffmpeg.test.ts
import { createFFmpeg } from '@ffmpeg/ffmpeg';

jest.setTimeout(120_000);

describe('ffmpeg.wasm smoke', () => {
  it('creates a trivial output', async () => {
    const ffmpeg = createFFmpeg({ log: false });
    await ffmpeg.load();
    // Minimal FS touch: write a small buffer
    ffmpeg.FS('writeFile', 'in.raw', new Uint8Array([0]));
    // Generate a 100ms silent audio (or tiny video) depending on build support
    await ffmpeg.run('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono', '-t', '0.1', 'out.wav');
    const data = ffmpeg.FS('readFile', 'out.wav');
    expect(data.length).toBeGreaterThan(0);
  });
});
```

> Ensure this test is wired via `pnpm test` and executes under a supported jest environment for the ffmpeg.wasm version in use.

---

## SUMMARY: WHAT MAKES CODE "PERFECT"

Deliver code that:

1. Works immediately in **WSL** with **mise** and **Docker**
2. Passes lint, format, type checks, and tests
3. Contains zero placeholders
4. Follows project conventions and principles
5. Includes robust error handling & edge cases
6. Is accessible & maintainable
7. Fully solves the stated requirements
