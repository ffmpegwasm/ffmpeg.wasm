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
        await worker.remove(name);
        const { data } = await worker.read('output.mp4');
        await worker.remove('output.mp4');
        expect(data.length).to.be(FLAME_MP4_LENGTH);
      }).timeout(TIMEOUT)
    ));
  });
});
