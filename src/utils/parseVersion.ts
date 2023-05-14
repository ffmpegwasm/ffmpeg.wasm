import type { FFmpegCoreVersion } from "../types";

const coreVersionRegExp = /^ffmpeg\sversion\s([^\s]+)/m;
const configurationRegExp = /^\s*configuration:\s(.+)$/m;
const libsRegExp = /^\s*(\w+)\s*(\d+)\.\s*(\d+)\.\s*(\d+)\s*\/.*$/gm;

export function parseVersion(output: string): FFmpegCoreVersion {
  return {
    version: output.match(coreVersionRegExp)?.[0] ?? "unknown",
    configuration: output.match(configurationRegExp)?.[0] ?? "",
    libs: Object.fromEntries(
      [...output.matchAll(libsRegExp)].map(([, name, major, minor, patch]) => [
        name as string,
        `${major as string}.${minor as string}.${patch as string}`,
      ])
    ),
    raw: output,
  };
}
