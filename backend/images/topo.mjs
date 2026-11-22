function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function makeNoise(rand) {
	const p = Array.from({length: 256}, (_, i) => i);
	for (let i = 255; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[p[i], p[j]] = [p[j], p[i]];
	}

	const perm = new Uint8Array(512);
	for (let i = 0; i < 512; i++) {
		perm[i] = p[i & 255];
	}

	const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
	const lerp = (a, b, t) => a + t * (b - a);
	const grad = (h, x, y) => {
		switch (h & 7) {
			case 0:
				return x + y;
			case 1:
				return -x + y;
			case 2:
				return x - y;
			case 3:
				return -x - y;
			case 4:
				return x;
			case 5:
				return -x;
			case 6:
				return y;
			default:
				return -y;
		}
	};

	return (x, y) => {
		const xi = Math.floor(x),
			yi = Math.floor(y);
		const xf = x - xi,
			yf = y - yi;
		const X = xi & 255,
			Y = yi & 255;
		const u = fade(xf),
			v = fade(yf);
		const aa = perm[perm[X] + Y],
			ab = perm[perm[X] + Y + 1];
		const ba = perm[perm[X + 1] + Y],
			bb = perm[perm[X + 1] + Y + 1];
		return lerp(
			lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
			lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
			v,
		);
	};
}

export function buildField(cols, rows, scale, seed, smoothing) {
	const rand = mulberry32(seed);
	const noise = makeNoise(rand);
	const octaves = [1, 2, 4].map((freq, i) => ({
		freq,
		amp: i === 0 ? 1 : (1 / 2 ** i) * (1 - smoothing),
		ox: rand() * 500,
		oy: rand() * 500,
	}));

	const stride = cols + 1;
	const field = new Float32Array(stride * (rows + 1));
	const long = Math.max(cols, rows);
	let min = Infinity,
		max = -Infinity;

	for (let j = 0; j <= rows; j++) {
		for (let i = 0; i <= cols; i++) {
			const nx = (i / long) * scale;
			const ny = (j / long) * scale;
			let v = 0;

			for (const o of octaves) {
				v += o.amp * noise(nx * o.freq + o.ox, ny * o.freq + o.oy);
			}
			field[j * stride + i] = v;
			if (v < min) min = v;
			if (v > max) max = v;
		}
	}

	const span = max - min || 1;
	for (let k = 0; k < field.length; k++) {
		field[k] = (field[k] - min) / span;
	}
	return field;
}

function contourSegments(field, cols, rows, level, emit) {
	const stride = cols + 1;
	for (let j = 0; j < rows; j++) {
		for (let i = 0; i < cols; i++) {
			const a = field[j * stride + i]; // top-left
			const b = field[j * stride + i + 1]; // top-right
			const c = field[(j + 1) * stride + i + 1]; // bottom-right
			const d = field[(j + 1) * stride + i]; // bottom-left

			const idx =
				(a > level ? 8 : 0) |
				(b > level ? 4 : 0) |
				(c > level ? 2 : 0) |
				(d > level ? 1 : 0);
			if (idx === 0 || idx === 15) continue;

			const tx = i + (level - a) / (b - a); // top edge
			const bx = i + (level - d) / (c - d); // bottom edge
			const ly = j + (level - a) / (d - a); // left edge
			const ry = j + (level - b) / (c - b); // right edge
			const x0 = i,
				x1 = i + 1,
				y0 = j,
				y1 = j + 1;

			switch (idx) {
				case 1:
				case 14:
					emit(x0, ly, bx, y1);
					break;
				case 2:
				case 13:
					emit(bx, y1, x1, ry);
					break;
				case 3:
				case 12:
					emit(x0, ly, x1, ry);
					break;
				case 4:
				case 11:
					emit(tx, y0, x1, ry);
					break;
				case 5:
					emit(tx, y0, x1, ry);
					emit(x0, ly, bx, y1);
					break;
				case 6:
				case 9:
					emit(tx, y0, bx, y1);
					break;
				case 7:
				case 8:
					emit(x0, ly, tx, y0);
					break;
				case 10:
					emit(x0, ly, tx, y0);
					emit(bx, y1, x1, ry);
					break;
			}
		}
	}
}

export async function renderTopoPng({
	width,
	height,
	background,
	lineColor,
	levels = 18,
	scale = 3,
	seed = 1,
	smoothing = 0,
}) {
	const cell = Math.max(3, Math.ceil(Math.max(width, height) / 1000));
	const cols = Math.max(1, Math.ceil(width / cell));
	const rows = Math.max(1, Math.ceil(height / cell));

	const field = buildField(cols, rows, scale, seed, smoothing);
	const canvas = document.createElement("canvas");

	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error(
			"Canvas isnt available in this browser (ur either on mobile or on an OLD ASF BROWSER UNC)",
		);
	}

	ctx.fillStyle = background;
	ctx.fillRect(0, 0, width, height);

	ctx.strokeStyle = lineColor;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";

	const baseWidth = Math.max(1, Math.min(width, height) / 450);

	for (let k = 0; k < levels; k++) {
		const level = 0.06 + (0.88 * (k + 0.5)) / levels;
		const major = k % 5 === 0;

		ctx.lineWidth = major ? baseWidth * 2 : baseWidth;
		ctx.globalAlpha = major ? 1 : 0.7;
		ctx.beginPath();

		contourSegments(field, cols, rows, level, (x1, y1, x2, y2) => {
			ctx.moveTo(x1 * cell, y1 * cell);
			ctx.lineTo(x2 * cell, y2 * cell);
		});
		ctx.stroke();
	}
	ctx.globalAlpha = 1;

	const blob = await new Promise((resolve) =>
		canvas.toBlob(resolve, "image/png"),
	);
	if (!blob) {
		throw new Error(
			"Couldnt create the image (might be too big for this browser)",
		);
	}
	return new Uint8Array(await blob.arrayBuffer());
}
