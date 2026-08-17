let core;

const genName = (name) => `[ffmpeg-core][${FFMPEG_TYPE}] ${name}`;

const reset = () => {
  core.reset();
  core.setLogger(() => {});
  core.setProgress(() => {});
};

before(async () => {
  core = await createFFmpegCore();
  core.FS.writeFile("video.mp4", b64ToUint8Array(VIDEO_1S_MP4));
});

describe(genName("createFFmpeg()"), () => {
  it("should be OK", () => {
    expect(core).to.be.ok;
  });
});

describe(genName("reset()"), () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("reset" in core).to.be.true;
  });
  it("should reset ret and timeout", () => {
    core.ret = 1024;
    core.timeout = 1024;

    core.reset();

    expect(core.ret).to.equal(-1);
    expect(core.timeout).to.equal(-1);
  });
});

describe(genName("exec()"), () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("exec" in core).to.be.true;
  });

  it("should output help", () => {
    expect(core.exec("-h")).to.equal(0);
  });

  it("should transcode", () => {
    expect(core.exec("-i", "video.mp4", "video.avi")).to.equal(0);
    const out = core.FS.readFile("video.avi");
    expect(out.length).to.not.equal(0);
    core.FS.unlink("video.avi");
  });
});

describe(genName("wasm stack"), () => {
  beforeEach(reset);

  /*
   * ffmpeg and ffprobe finish by calling exit(), which Emscripten implements
   * by throwing. The exception unwinds the JavaScript frames but not the
   * WebAssembly stack, so without an explicit stackRestore() every call leaks
   * the stack space its C frames were using. Once the stack runs out the
   * module traps with "memory access out of bounds" on every later call.
   */
  it("should not leak stack across exec()", () => {
    const sp = core.stackSave();

    expect(core.exec("-h")).to.equal(0);
    expect(core.stackSave()).to.equal(sp);

    expect(core.exec("-i", "video.mp4", "video.avi")).to.equal(0);
    core.FS.unlink("video.avi");
    expect(core.stackSave()).to.equal(sp);
  });

  it("should not leak stack across ffprobe()", () => {
    const sp = core.stackSave();

    expect(core.ffprobe("-h")).to.equal(0);
    expect(core.stackSave()).to.equal(sp);

    core.ffprobe("-i", "video.mp4", "-show_format", "-o", "format.txt");
    core.FS.unlink("format.txt");
    expect(core.stackSave()).to.equal(sp);
  });

  it("should not leak stack when a command fails", () => {
    const sp = core.stackSave();

    expect(core.exec("-i", "nonexistent.mp4", "out.avi")).to.not.equal(0);

    expect(core.stackSave()).to.equal(sp);
  });
});

describe(genName("setTimeout()"), () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("setTimeout" in core).to.be.true;
  });

  it("should timeout", () => {
    core.setTimeout(1); // timeout after 1ms
    expect(core.exec("-i", "video.mp4", "video.avi")).to.equal(1);
  });
});

describe(genName("setLogger()"), () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("setLogger" in core).to.be.true;
  });

  it("should handle logs", () => {
    const logs = [];
    core.setLogger(({ message }) => logs.push(message));
    core.exec("-h");
    expect(logs.length).to.not.equal(0);
  });
});

describe(genName("setProgress()"), () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("setProgress" in core).to.be.true;
  });

  it("should handle progress", () => {
    let progress = 0;
    core.setProgress(({ progress: _progress }) => (progress = _progress));
    expect(core.exec("-i", "video.mp4", "video.avi")).to.equal(0);
    expect(progress).to.equal(1);
    core.FS.unlink("video.avi");
  });
});
