importScripts('/dist/ffmpeg.dev.js');
const ffmpeg = self.FFmpeg.createFFmpeg({log: true});

onmessage = async (event) => {
    try {
        const {buffer, name, inType, outType} = event.data;
        if (!ffmpeg.isLoaded()) {
            await ffmpeg.load();
        }

        ffmpeg.FS('writeFile', `${name}.${inType}`, new Uint8Array(buffer));
        await ffmpeg.run('-i', `${name}.${inType}`, `${name}.${outType}`);
        const data = ffmpeg.FS('readFile', `${name}.${outType}`);

        postMessage({buffer: data.buffer, type: "result"}, [data.buffer]);

        // delete files from memory
        ffmpeg.FS('unlink', `${name}.${inType}`);
        ffmpeg.FS('unlink', `${name}.${outType}`);
    } catch (e) {
        postMessage({type: "error", error: e});
    }
}

