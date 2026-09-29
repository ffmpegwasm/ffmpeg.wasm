import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [solidStart({ ssr: false }), tailwindcss()],
    optimizeDeps: {
        include: ['@solidjs/start > @jridgewell/trace-mapping'],
        exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
    },
});
