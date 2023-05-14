import type { FFmpegLogger } from "../options";
import type { FFmpegCoreConstructor } from "../types";

export const importCore = async (
  core: string | FFmpegCoreConstructor,
  logger: FFmpegLogger
): Promise<FFmpegCoreConstructor> => {
  switch (typeof core) {
    case "string": {
      try {
        //@ts-expect-error this is an inline module
        await import("data:text/javascript;base64,Cg==");
        logger("info", `Import '${core}' with esm dynamic import()`);
        return ((await import(core)) as { default: FFmpegCoreConstructor })
          .default;
      } catch (err) {
        if (typeof require === "function") {
          logger("info", `Import '${core}' with cjs require()`);
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          return require(core) as FFmpegCoreConstructor;
        }
      }
      throw new Error(
        "Neither import nor require exists, please try to import the core manually!"
      );
    }
    case "function":
      return core;
    default: {
      throw new Error(
        `Invalid type of option core: ${typeof core}, expect string or function`
      );
    }
  }
};
