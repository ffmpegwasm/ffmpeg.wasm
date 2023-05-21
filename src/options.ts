import type { FFmpegCoreConstructor } from "./types";

type FFmpegLogger = (level: "info" | "warn" | "error", msg: string) => void;

interface FFmpegInitOptions {
  core?: string | FFmpegCoreConstructor;
  defaultArgs?: string[];
  log?: boolean;
  logger?: FFmpegLogger;
}

const defaultInitOptions: Required<FFmpegInitOptions> = {
  core: "@ffmpeg.wasm/core-mt",
  defaultArgs: ["-nostdin", "-y", "-hide_banner"],
  log: false,
  logger: (level, msg) => console[level](`[${level}] `, msg),
};

interface FFmpegRunningOptions {
  useDefaultArgs: boolean;
}

const defaultRunningOptions: Required<FFmpegRunningOptions> = {
  useDefaultArgs: true,
};

export {
  type FFmpegInitOptions,
  type FFmpegLogger,
  type FFmpegRunningOptions,
  defaultInitOptions,
  defaultRunningOptions,
};
