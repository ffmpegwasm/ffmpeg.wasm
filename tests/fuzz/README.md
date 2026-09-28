# Fuzzing

```sh
pnpm fuzz                                    # 2 minutes, every strategy, random seed
pnpm fuzz --time=600 --strategy=media --seed=42
pnpm fuzz --repro=tests/fuzz/crashes/args-42-17.json
```

The fuzzer drives the real `FFmpeg` class in Chromium, like the unit tests,
with a seeded PRNG, so a seed reproduces a whole run. A case **fails** when a
call rejects with a trap or worker error, the core stops answering, or the case
hangs. An FFmpeg error exit code is fine. Each failure is saved to
`tests/fuzz/crashes/<strategy>-<seed>-<case>.json` with every call since the
core was last (re)loaded, since some crashes depend on earlier commands, and
`--repro` replays it.

Strategies are files in `strategies/` exporting
`generate(rng, seeds) -> [[method, ...args], ...]`, a list of calls on the
`FFmpeg` class:

| strategy | what it does |
| --- | --- |
| `media` | mutates seed media (bit flips, truncation, duplicated chunks, splices) and decodes and probes it: every demuxer and decoder |
| `args` | random filters, encoders, muxers and options with edge-case values on generated input |
| `api` | random sequences of file and command calls with odd paths and data |

Seed media is generated with ffmpeg.wasm itself (`SEEDS` in `lib.mjs`) and
cached in `.cache/fuzz-seeds`. To fuzz a new format, add a line there; to fuzz
something new, add a strategy file.

CI runs 15 minutes of fuzzing on pull requests labelled `fuzz-test` (and on
manual dispatch), and uploads any crashes as an artifact.
