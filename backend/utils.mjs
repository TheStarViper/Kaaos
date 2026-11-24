export function hexToRgb(hex) {
	const h = String(hex).replace("#", "");
	return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0);
}

export const pack = (r, g, b) => (255 << 24) | (b << 16) | (g << 8) | r;

export function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export async function renderToPng(width, height, drawCallback) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error(
			"Canvas isnt available in this browser (ur either on mobile or on an OLD ASF BROWSER UNC)",
		);
	}

	drawCallback(ctx);
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
