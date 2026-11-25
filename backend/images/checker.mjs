import {renderToPng} from "../utils.mjs";

export async function renderCheckerPng({
	width,
	height,
	colorA,
	colorB,
	size = 40,
}) {
	const tile = document.createElement("canvas");
	tile.width = tile.height = size * 2;
	const t = tile.getContext("2d");

	t.fillStyle = colorA;
	t.fillRect(0, 0, size * 2, size * 2);
	t.fillStyle = colorB;
	t.fillRect(size, 0, size, size);
	t.fillRect(0, size, size, size);

	return renderToPng(width, height, (ctx) => {
		ctx.fillStyle = ctx.createPattern(tile, "repeat");
		ctx.fillRect(0, 0, width, height);
	});
}
