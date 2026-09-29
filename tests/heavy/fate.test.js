// Decodes every sample of FFmpeg's FATE suite and compares the result with
// tests/heavy/baseline. `pnpm test:heavy -u` updates the baseline.
import { expect, test } from "vitest";
import { decoder, samples } from "./fate.js";

const decode = decoder();

test.for(samples)("%s", async (sample) => {
  const result = await decode(sample);
  expect(result).toMatchSnapshot();
});
