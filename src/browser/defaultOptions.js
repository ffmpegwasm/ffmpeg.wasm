import pkg from "../../package.json";

/*
 * Default options for browser environment
 */
const corePath =
  typeof process !== "undefined" && process.env.NODE_ENV === "development"
    ? new URL(
        "/node_modules/@ffmpeg.wasm/core-mt/dist/ffmpeg-core.js",
        import.meta.url
      ).href
    : `https://unpkg.com/@ffmpeg.wasm/core-mt@${pkg.devDependencies[
        "@ffmpeg.wasm/core-mt"
      ].substring(1)}/dist/ffmpeg-core.js`;

export default { corePath };
