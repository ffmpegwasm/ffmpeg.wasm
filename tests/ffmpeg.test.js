const { createFFmpeg } = FFmpeg;
const ffmpeg = createFFmpeg(OPTIONS);

before(async function cb() {
  this.timeout(0);
  await ffmpeg.load();
});

describe('transcode()', () => {
  describe('should transcode different format', () => {
    [1, 2, 4].forEach((n) => {
      [
        { from: 'flame.avi', to: 'flame.mp4' },
        { from: 'flame.avi', to: 'flame.webm' },
        { from: 'StarWars3.wav', to: 'StarWars3.mp3' },
      ].forEach(({ from, to }) => (
        it(`transcode ${from} to ${to} (${n} threads)`, async () => {
          await ffmpeg.write(from, `${BASE_URL}/${from}`);
          await ffmpeg.transcode(from, to, `-threads ${n}`);
          const data = ffmpeg.read(to);
          ffmpeg.remove(to);
          expect(data.length).not.to.be(0);
        }).timeout(TIMEOUT)
      ));
    });
  });
});

describe('run()', () => {
  describe('should run a command with quoted parameters at start no spaces', () => {
    ['flame.avi'].forEach((name) => (
      it(`run ${name}`, async () => {
        await ffmpeg.write(name, `${BASE_URL}/${name}`);
        await ffmpeg.run(`-y -i ${name} -metadata 'title="test"' output.mp4`);
        const data = ffmpeg.read('output.mp4');
        expect(data.length).to.be(META_FLAME_MP4_LENGTH_NO_SPACE);
      }).timeout(TIMEOUT)
    ));
  });

  describe('should run a command with quoted parameters at start and a space in between', () => {
    ['flame.avi'].forEach((name) => (
      it(`run ${name}`, async () => {
        await ffmpeg.write(name, `${BASE_URL}/${name}`);
        await ffmpeg.run(`-y -i ${name} -metadata 'title="my title"' output.mp4`);
        const data = ffmpeg.read('output.mp4');
        expect(data.length).to.be(META_FLAME_MP4_LENGTH);
      }).timeout(TIMEOUT)
    ));
  });

  describe('should run a command with name quoted parameters and a space in between', () => {
    ['flame.avi'].forEach((name) => (
      it(`run ${name}`, async () => {
        await ffmpeg.write(name, `${BASE_URL}/${name}`);
        await ffmpeg.run(`-y -i ${name} -metadata title="my title" output.mp4`);
        const data = ffmpeg.read('output.mp4');
        expect(data.length).to.be(META_FLAME_MP4_LENGTH);
      }).timeout(TIMEOUT)
    ));
  });
});
