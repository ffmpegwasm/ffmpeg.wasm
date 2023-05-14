interface FFmpegVersion {
  core: FFmpegCoreVersion;
  main: string;
}

interface FFmpegCoreVersion {
  /**
   * Version of FFmpeg core
   */
  version: string;
  /**
   * Build params
   */
  configuration: string;
  /**
   * Libraries version
   */
  libs: {
    [name: string]: string;
  };
  /**
   * Raw result of $(ffmpeg -version)
   */
  raw: string;
}

export type { FFmpegVersion, FFmpegCoreVersion };
