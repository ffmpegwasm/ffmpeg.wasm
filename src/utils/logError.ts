import type { FFmpegLogger } from "../options";

export const logError = (
  err: unknown,
  args: string[],
  logger: FFmpegLogger
) => {
  const reason = err instanceof Error ? err?.message : err;
  logger("error", `Failed to execute '${args.join(" ")}': `, reason);
};
