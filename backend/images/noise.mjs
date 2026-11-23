import {hexToRgb} from "../utils.mjs";

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
const pack = (r, g, b) => (255 << 24) | (b << 16) | (g << 8) | r;

function gaussian() {
	const u = 1 - Math.random();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

function cloudField(cols, rows) {
	const field = new Float32Array(cols * rows);
	const long = Math.max(cols, rows);
	let amp = 1;

	for (let octave = 0; octave < 4; octave++) {
		const freq = 4 * 2 ** octave;
		const gw = Math.ceil((cols / long) * freq) + 2;
		const gh = Math.ceil((rows / long) * freq) + 2;

		const grid = new Float32Array(gw * gh);
		for (let i = 0; i < grid.length; i++) {
			grid[i] = Math.random();
		}

		for (let y = 0; y < rows; y++) {
			const gy = (y / long) * freq;
			const y0 = gy | 0;
			const fy = gy - y0;
			const sy = fy * fy * (3 - 2 * fy);
			for (let x = 0; x < cols; x++) {
				const gx = (x / long) * freq;
				const x0 = gx | 0;
				const fx = gx - x0;
				const sx = fx * fx * (3 - 2 * fx);
				const a = grid[y0 * gw + x0];
				const b = grid[y0 * gw + x0 + 1];
				const c = grid[(y0 + 1) * gw + x0];
				const d = grid[(y0 + 1) * gw + x0 + 1];
				const top = a + (b - a) * sx;
				const bottom = c + (d - c) * sx;
				field[y * cols + x] += amp * (top + (bottom - top) * sy);
			}
		}
		amp *= 0.5;
	}
	let min = Infinity;
	let max = -Infinity;

	for (let i = 0; i < field.length; i++) {
		if (field[i] < min) {
			min = field[i];
		}

		if (field[i] > max) {
			max = field[i];
		}
	}

	const span = max - min || 1;
	for (let i = 0; i < field.length; i++) {
		field[i] = (field[i] - min) / span;
	}

	return field;
}

function drawClouds(ctx, width, height, colorA, colorB) {
	const cell = Math.max(2, Math.ceil(Math.max(width, height) / 600));
	const cols = Math.ceil(width / cell);
	const rows = Math.ceil(height / cell);
	const field = cloudField(cols, rows);

	const small = document.createElement("canvas");
	small.width = cols;
	small.height = rows;
	const sctx = small.getContext("2d");
	const img = sctx.createImageData(cols, rows);
	const px = new Uint32Array(img.data.buffer);
	const [r1, g1, b1] = hexToRgb(colorA);
	const [r2, g2, b2] = hexToRgb(colorB);

	for (let i = 0; i < field.length; i++) {
		const t = field[i];
		px[i] = pack(
			clamp(r1 + (r2 - r1) * t),
			clamp(g1 + (g2 - g1) * t),
			clamp(b1 + (b2 - b1) * t),
		);
	}
	sctx.putImageData(img, 0, 0);

	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = "high";
	ctx.drawImage(small, 0, 0, cols * cell, rows * cell);
}

export async function renderNoisePng({width, height, kind, colorA, colorB}) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error(
			"Canvas isnt available in this browser (ur either on mobile or on an OLD ASF BROWSER UNC)",
		);
	}

	if (kind === "clouds") {
		drawClouds(ctx, width, height, colorA, colorB);
	} else {
		const image = ctx.createImageData(width, height);
		const px = new Uint32Array(image.data.buffer);
		const n = px.length;

		if (kind === "white") {
			for (let i = 0; i < n; i++) {
				const v = (Math.random() * 256) | 0;
				px[i] = pack(v, v, v);
			}
		} else if (kind === "color") {
			for (let i = 0; i < n; i++) {
				px[i] = pack(
					(Math.random() * 256) | 0,
					(Math.random() * 256) | 0,
					(Math.random() * 256) | 0,
				);
			}
		} else if (kind === "tinted") {
			const [r, g, b] = hexToRgb(colorA);
			for (let i = 0; i < n; i++) {
				const d = (Math.random() - 0.5) * 180;
				px[i] = pack(clamp(r + d), clamp(g + d), clamp(b + d));
			}
		} else if (kind === "gaussian") {
			for (let i = 0; i < n; i++) {
				const v = clamp(128 + gaussian() * 40);
				px[i] = pack(v, v, v);
			}
		} else if (kind === "saltpepper") {
			const grey = pack(128, 128, 128);
			const black = pack(0, 0, 0);
			const white = pack(255, 255, 255);
			for (let i = 0; i < n; i++) {
				const r = Math.random();
				px[i] = r < 0.06 ? black : r < 0.12 ? white : grey;
			}
		} else {
			throw new Error(`Unknown type: ${kind}`);
		}
		ctx.putImageData(image, 0, 0);
	}

	const blob = await new Promise((resolve) =>
		canvas.toBlob(resolve, "image/png"),
	);
	if (!blob)
		throw new Error(
			"Couldn't create the image (it may be too large for this browser).",
		);
	return new Uint8Array(await blob.arrayBuffer());
}
