const { createWorker } = FFmpeg;
const worker = createWorker(OPTIONS);

before(async function cb() {
  this.timeout(0);
  await worker.load();
});

describe('transcode()', () => {
  describe('should transcode different format', () => {
    ['flame.avi'].forEach((name) => (
      it(`transcode ${name}`, async () => {
        await worker.write(name, `${BASE_URL}/${name}`);
        await worker.transcode(name, 'output.mp4');
        const { data } = await worker.read('output.mp4');
        expect(data.length).to.be(FLAME_MP4_LENGTH);
      }).timeout(TIMEOUT)
    ));
  });
});

describe('run()', () => {
  describe('should run a command with quoted parameters at start no spaces', () => {
    ['flame.avi'].forEach((name) => (
      it(`run ${name}`, async () => {
        await worker.write(name, `${BASE_URL}/${name}`);
        await worker.run(`-y -i ${name} -metadata 'title="test"' output.mp4`);
        const { data } = await worker.read('output.mp4');
        expect(data.length).to.be(META_FLAME_MP4_LENGTH_NO_SPACE);
      }).timeout(TIMEOUT)
    ));
  });

  describe('should run a command with quoted parameters at start and a space in between', () => {
    ['flame.avi'].forEach((name) => (
      it(`run ${name}`, async () => {
        await worker.write(name, `${BASE_URL}/${name}`);
        await worker.run(`-y -i ${name} -metadata 'title="my title"' output.mp4`);
        const { data } = await worker.read('output.mp4');
        expect(data.length).to.be(META_FLAME_MP4_LENGTH);
      }).timeout(TIMEOUT)
    ));
  });

  describe('should run a command with name quoted parameters and a space in between', () => {
    ['flame.avi'].forEach((name) => (
      it(`run ${name}`, async () => {
        await worker.write(name, `${BASE_URL}/${name}`);
        await worker.run(`-y -i ${name} -metadata title="my title" output.mp4`);
        const { data } = await worker.read('output.mp4');
        expect(data.length).to.be(META_FLAME_MP4_LENGTH);
      }).timeout(TIMEOUT)
    ));
  });
});
