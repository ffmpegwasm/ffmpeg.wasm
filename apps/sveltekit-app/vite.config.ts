import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config';

/** @type {import('vite').Plugin} */
const viteServerConfig = {
    name: 'log-request-middleware',
    configureServer(server) {
        server.middlewares.use((req, res, next) => {
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET");
            res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
            next();
        });
    }
};


export default defineConfig({
	plugins: [sveltekit(), viteServerConfig],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: {
		  '@': fileURLToPath(new URL('./src', import.meta.url))
		}
	  },
	  optimizeDeps: {
		exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
	  },
	  server: {
		headers: {
		  'Cross-Origin-Opener-Policy': 'same-origin',
		  'Cross-Origin-Embedder-Policy': 'require-corp'
		},
		fs: {
			allow: ['../..']
		}
	  }	
});
