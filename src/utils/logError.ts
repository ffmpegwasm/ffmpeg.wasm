import type { FFmpegLogger } from "../options";

export const logError = (
  err: unknown,
  args: string[],
  logger: FFmpegLogger
) => {
  const reason: string | undefined =
    err instanceof Error ? err.message : err?.toString();
  logger(
    "error",
    `Failed to execute '${args.join(" ")}'${reason ? `: ${reason}` : ""}`
  );
};
