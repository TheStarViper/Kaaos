import {defineConfig} from "vite";
import {readdirSync} from "node:fs";
import {resolve, dirname} from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pages = Object.fromEntries(
	readdirSync(__dirname)
		.filter((f) => f.endsWith(".html"))
		.map((f) => [f.replace(".html", ""), resolve(__dirname, f)]),
);

export default defineConfig({
	base: "./",
	build: {
		rollupOptions: {
			input:
				Object.keys(pages).length > 0
					? pages
					: resolve(__dirname, "frontend/index.html"),
			output: {
				assetFileNames: "assets/[name].[hash][extname]",
				chunkFileNames: "assets/[name].[hash].js",
				entryFileNames: "assets/[name].[hash].js",
			},
		},
	},
	optimizeDeps: {
		exclude: ["@imagemagick/magick-wasm"],
	},
});
