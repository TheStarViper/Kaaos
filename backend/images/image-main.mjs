import {renderTopoPng} from "./topo.mjs";
import {renderCheckerPng} from "./checker.mjs";
import { renderNoisePng } from "./noise.mjs";

const $ = (id) => document.getElementById(id);

const form = $("image-form");
const button = $("img-generate");
const statusEl = $("img-status");
const result = $("img-result");
const preview = $("img-preview");
const meta = $("img-meta");
const download = $("img-download");
const color1 = $("img-color1");
const color2 = $("img-color2");
const optionsEl = $("img-options");
const pickHint = $("img-pick-hint");
const fieldEls = form.querySelectorAll("[data-styles]");
const colorLabels = [$("img-color1-label"), $("img-color2-label")];
const noiseType = $("noise-type");

//topo vals
const topoLevels = $("topo-levels");
const topoScale = $("topo-scale");
const topoSeed = $("topo-seed");
const topoSmooth = $("topo-smooth");

for (const range of [topoLevels, topoScale, topoSmooth]) {
	const out = $(`${range.id}-out`);
	const update = () => {
		out.textContent = range.value;
		range.style.setProperty(
			"--p",
			(range.value - range.min) / (range.max - range.min),
		);
	};
	range.addEventListener("input", update);
	update();
}

function syncPreviewColors() {
	const root = document.documentElement.style;
	root.setProperty("--c1", color1.value);
	root.setProperty("--c2", color2.value);
}

color1.addEventListener("input", syncPreviewColors);
color2.addEventListener("input", syncPreviewColors);
syncPreviewColors();

const MIME = {
	png: "image/png",
	jpg: "image/jpeg",
	webp: "image/webp",
	gif: "image/gif",
	bmp: "image/bmp",
	tiff: "image/tiff",
};

const MAGICK_FORMAT = {
	png: "Png",
	jpg: "Jpeg",
	webp: "WebP",
	gif: "Gif",
	bmp: "Bmp",
	tiff: "Tiff",
};

let magickPromise = null;
let objectUrl = null;

function loadMagick() {
	if (!magickPromise) {
		magickPromise = (async () => {
			const [lib, wasm] = await Promise.all([
				import("@imagemagick/magick-wasm"),
				import("@imagemagick/magick-wasm/magick.wasm?url"),
			]);
			await lib.initializeImageMagick(new URL(wasm.default, import.meta.url));
			return lib;
		})().catch((error) => {
			magickPromise = null;
			throw error;
		});
	}
	return magickPromise;
}

const nextPaint = () =>
	new Promise((resolve) => {
		requestAnimationFrame(() => setTimeout(resolve, 0));
		setTimeout(resolve, 100);
	});

function setStatus(text, isError = false) {
	statusEl.textContent = text;
	statusEl.classList.toggle("error", isError);
}

const COLOR_LABELS = {
	solid: ["Color"],
	gradient: ["Start Color", "End Color"],
	radial: ["Center Color", "Edge Color"],
	plasma: ["Color 1", "Color 2"],
	checker: ["Color 1", "Color 2"],
	"noise:tinted": ["Base color"],
  	"noise:clouds": ["Dark color", "Light color"],
	topo: ["Background Color", "Line Color"],
};

//show only options a style needs
function syncFields() {
	const style = form.elements.style.value;
	const key = style === "noise" ? `noise:${noiseType.value}` : style;

	optionsEl.hidden = !style;
	pickHint.hidden = !!style;
	for (const el of fieldEls) {
		const wanted = el.dataset.styles.split(" ");
		el.hidden = !style || !(wanted.includes(style)||wanted.includes(key));
	}
	const labels = COLOR_LABELS[key] || COLOR_LABELS[style] || [];
	colorLabels.forEach((el, i) => {
		if (labels[i]) {
			el.textContent = labels[i];
		}
	});
}

form.addEventListener("change", (e) => {
	if (e.target.name === "style"||e.target.id==="noise-type") syncFields();
});
syncFields();

const MAX_SIZE = 4000;
function readSize(input) {
	const n = Number(input.value);
	return Number.isInteger(n) && n >= 1 && n <= MAX_SIZE ? n : null;
}

function fileBase() {
	const raw = $("img-name").value.trim() || "Kaaos generated";
	return (
		raw.replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-") || "Kaaos generated"
	);
}

function render(lib, {width, height, style, c1, c2, format}) {
	const {ImageMagick, MagickFormat, MagickReadSettings, NoiseType} = lib;

	const specs = {
		solid: `xc:${c1}`,
		gradient: `gradient:${c1}-${c2}`,
		radial: `radial-gradient:${c1}-${c2}`,
		plasma: `plasma:${c1}-${c2}`,
		checker: "pattern:checkerboard",
		noise: `xc:${c1}`,
	};

	const settings = new MagickReadSettings();
	settings.width = width;
	settings.height = height;

	let bytes = null;
	ImageMagick.read(specs[style], settings, (image) => {
		if (style === "noise") image.addNoise(NoiseType.Random);
		image.write(MagickFormat[MAGICK_FORMAT[format]], (data) => {
			bytes = data.slice();
		});
	});
	return bytes;
}

function convertPng(lib, png, format) {
	const {ImageMagick, MagickFormat} = lib;
	let bytes = null;
	ImageMagick.read(png, (image) => {
		image.write(MagickFormat[MAGICK_FORMAT[format]], (data) => {
			bytes = data.slice();
		});
	});
	return bytes;
}

form.addEventListener("submit", async (events) => {
	events.preventDefault();

	const widthInput = $("img-width");
	const heightInput = $("img-height");
	const width = readSize(widthInput);
	const height = readSize(heightInput);
	if (!width || !height) {
		setStatus(
			`Width and height must be whole numbers from 1 to ${MAX_SIZE}.`,
			true,
		);
		(!width ? widthInput : heightInput).focus();
		return;
	}

	const format = $("img-format").value;
	const style = form.elements.style.value;
	if (!style) {
		setStatus("Pick a style to generate before clicking generate buddy", true);
		return;
	}
	button.disabled = true;
	setStatus("Loading Imagemagick");

	try {
		const started = performance.now();
		let bytes;
		let seedUsed = null;

		if (style === "topo") {
			setStatus("Generating");
			await nextPaint();
			const seedText = topoSeed.value.trim();
			seedUsed =
				seedText === ""
					? Math.floor(Math.random() * 1_000_000)
					: Math.floor(Number(seedText)) || 0;
			const png = await renderTopoPng({
				width,
				height,
				seed: seedUsed,
				background: color1.value,
				lineColor: color2.value,
				levels: Number(topoLevels.value),
				scale: Number(topoScale.value),
				smoothing: Number(topoSmooth.value) / 10,
			});

			if (format === "png") {
				bytes = png;
			} else {
				setStatus("Loading imagemagick");
				bytes = convertPng(await loadMagick(), png, format);
			}
		} else if (style==="noise"){
			setStatus("Generating");
			await nextPaint();
			const png = await renderNoisePng({
				width,
				height,
				kind: noiseType.value,
				colorA: color1.value,
				colorB: color2.value,
			});
			if (format === "png") {
				bytes = png;
			} else {
				setStatus("Loading imagemagick");
				bytes = convertPng(await loadMagick(), png, format);
			}
		}else if (style === "checker") {
			setStatus("Generating");
			await nextPaint();
			const png = await renderCheckerPng({
				width,
				height,
				colorA: color1.value,
				colorB: color2.value,
				size: Math.max(
					1,
					Math.min(2000, Math.round(Number($("checker-size").value)) || 40),
				),
			});
			if (format === "png") {
				bytes = png;
			} else {
				setStatus("Loading imagemagick");
				bytes = convertPng(await loadMagick(), png, format);
			}
		} else {
			setStatus("Loading imagemagick");
			const lib = await loadMagick();
			setStatus("Generating");
			await nextPaint();
			bytes = render(lib, {
				width,
				height,
				format,
				style: form.elements.style.value,
				c1: color1.value,
				c2: color2.value,
			});
		}

		if (!bytes || !bytes.length) {
			throw new Error("No image data was produced");
		}
		const blob = new Blob([bytes], {type: MIME[format]});
		if (objectUrl) URL.revokeObjectURL(objectUrl);
		objectUrl = URL.createObjectURL(blob);

		const filename = `${fileBase()}.${format}`;
		preview.alt = `Generated ${width} by ${height} ${format.toUpperCase()} image`;
		preview.src = objectUrl;
		download.href = objectUrl;
		download.download = filename;
		meta.textContent =
			`${filename} · ${width}×${height} · ${(blob.size / 1024).toFixed(1)} KB` +
			(seedUsed !== null ? ` · seed ${seedUsed}` : "") +
			(format === "tiff"
				? " · browsers can't preview TIFF, but the download works"
				: "");

		result.hidden = false;
		setStatus(`Done in ${Math.round(performance.now() - started)} ms.`);
	} catch (error) {
		console.error(error);
		setStatus(`Something went wrong: ${error.message || error}`, true);
	} finally {
		button.disabled = false;
	}
});
