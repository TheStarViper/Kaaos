import {defineConfig} from "vite";
import {readdir, readdirSync} from "node:fs";
import {fileURLToPath, readURLToPath} from "node:url";

const pages = Object.fromEntries(
	readdirSync(".")
		.filter((f) => f.endsWith(".html"))
		.map((f) => [
			f.replace(".html", ""),
			fileURLToPath(new URL(f, import.meta.url)),
		]),
);

export default defineConfig({
	base: "./",
	build: {rollupOptions: {input: './frontend/index.html'}},
	optimizeDeps: {exlude: ["@imagemagick/magick-wasm"]},
});
