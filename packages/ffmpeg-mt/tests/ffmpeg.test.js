let ffmpeg;

const b64ToUint8Array = (b64) => {
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
};

const reset = () => {
  ffmpeg.reset();
  ffmpeg.setLogger(() => {});
  ffmpeg.setProgress(() => {});
};

before(async function () {
  this.timeout(0);
  ffmpeg = await createFFmpeg();
  ffmpeg.FS.writeFile("video.mp4", b64ToUint8Array(VIDEO_1S_MP4));
});

describe("createFFmpeg()", () => {
  it("should be OK", () => {
    expect(ffmpeg).to.be.ok;
  });
});

describe("reset()", () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("reset" in ffmpeg).to.be.true;
  });

  it("should reset ret and timeout", () => {
    ffmpeg.ret = 1024;
    ffmpeg.timeout = 1024;

    ffmpeg.reset();

    expect(ffmpeg.ret).to.equal(-1);
    expect(ffmpeg.timeout).to.equal(-1);
  });
});

describe("exec()", () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("exec" in ffmpeg).to.be.true;
  });

  it("should output help", () => {
    expect(ffmpeg.exec(["-h"])).to.equal(0);
  });

  it("should transcode", () => {
    expect(ffmpeg.exec(["-i", "video.mp4", "video.avi"])).to.equal(0);
    const out = ffmpeg.FS.readFile("video.avi");
    expect(out.length).to.not.equal(0);
    ffmpeg.FS.unlink("video.avi");
  });
});

describe("setTimeout()", () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("setTimeout" in ffmpeg).to.be.true;
  });

  it("should timeout", () => {
    ffmpeg.setTimeout(1); // timeout after 1ms
    expect(ffmpeg.exec(["-i", "video.mp4", "video.avi"])).to.equal(1);
  });
});

describe("setLogger()", () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("setLogger" in ffmpeg).to.be.true;
  });

  it("should handle logs", () => {
    const logs = [];
    ffmpeg.setLogger(({ message }) => logs.push(message));
    ffmpeg.exec(["-h"]);
    expect(logs.length).to.not.equal(0);
  });
});

describe("setProgress()", () => {
  beforeEach(reset);

  it("should exist", () => {
    expect("setProgress" in ffmpeg).to.be.true;
  });

  it("should handle progress", () => {
    let progress = 0;
    ffmpeg.setProgress((_progress) => (progress = _progress));
    expect(ffmpeg.exec(["-i", "video.mp4", "video.avi"])).to.equal(0);
    expect(progress).to.equal(1);
    ffmpeg.FS.unlink("video.avi");
  });
});
