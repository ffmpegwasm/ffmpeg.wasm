const resolveURL = require("resolve-url");
/*
 * Default options for browser environment
 */
module.exports = {
  
  corePath:
    typeof process !== "undefined" && process.env.FFMPEG_ENV === "development"
      ? resolveURL("/node_modules/@ffmpeg/core/ffmpeg-core.js")
      : process.env.PUBLIC_URL
      ? `${process.env.PUBLIC_}/ffmpeg-core.js`
      : // : `https://unpkg.com/@ffmpeg/core@v${devDependencies[
        //     "@ffmpeg/core"
        //   ].substring(1)}/ffmpeg-core.js`,
        `/ffmpeg-core.js`,
  // corePath: (typeof process !== 'undefined' && process.env.FFMPEG_ENV === 'development')
  //   ? resolveURL('/node_modules/@ffmpeg/core/dist/ffmpeg-core.js')
  //   : `https://unpkg.com/@ffmpeg/core@${devDependencies['@ffmpeg/core'].substring(1)}/dist/ffmpeg-core.js`,
};
