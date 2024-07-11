import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
    ssr: false,
    server: {
        static: true,
    },
    vite: {
        optimizeDeps: {
            exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
        },
    }
});
