import {drawFourPoint} from "./gradients.mjs";

const DEFAULTS = [
	{x: 0.12, y: 0.15, color: "#f77fe9"},
	{x: 0.88, y: 0.15, color: "#7c4dff"},
	{x: 0.12, y: 0.85, color: "#2f7fe0"},
	{x: 0.88, y: 0.85, color: "#00f5d4"},
];

const LOOP = [0, 1, 3, 2];
const DRAG_THRESHOLD = 4; //4px
const PREVIEW_WIDTH = 160;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function initFourPointEditor({root, widthInput, heightInput}) {
	const box = root.querySelector(".fp-box");
	const canvas = box.querySelector(".fp-canvas");
	const ctx = canvas.getContext("2d");
	const points = DEFAULTS.map((p) => ({...p}));

	function aspect() {
		const w = Number(widthInput.value);
		const h = Number(heightInput.value);
		return w > 0 && h > 0 ? w / h : 4 / 3;
	}

	function renderPreview() {
		const ar = aspect();
		box.style.setProperty("--ar", ar);
		canvas.width = PREVIEW_WIDTH;
		canvas.height = Math.max(1, Math.round(PREVIEW_WIDTH / ar));
		drawFourPoint(ctx, canvas.width, canvas.height, points);
	}

	const SVG_NS = "http://www.w3.org/2000/svg";
	const lines = document.createElementNS(SVG_NS, "svg");
	lines.setAttribute("class", "fp-lines");
	lines.setAttribute("viewBox", "0 0 100 100");
	lines.setAttribute("preserveAspectRatio", "none");
	const outline = document.createElementNS(SVG_NS, "polygon");
	outline.setAttribute("class", "fp-line-outline");
	const line = document.createElementNS(SVG_NS, "polygon");
	line.setAttribute("class", "fp-line");
	lines.append(outline, line);
	box.insertBefore(lines, canvas.nextSibling);

	function drawLines() {
		const path = LOOP.map(
			(i) => `${points[i].x * 100},${points[i].y * 100}`,
		).join(" ");
		outline.setAttribute("points", path);
		line.setAttribute("points", path);
	}

	function publishColors() {
		points.forEach((p, i) =>
			document.documentElement.style.setProperty(`--p${i + 1}`, p.color),
		);
	}

	points.forEach((p, i) => {
		const wrap = document.createElement("div");
		wrap.className = "fp-dot-wrap";

		const dot = document.createElement("button");
		dot.type = "button";
		dot.className = "fp-dot";
		dot.setAttribute(
			"aria-label",
			`Gradient point ${i + 1}. Drag to move, click to change its color.`,
		);
		dot.style.setProperty("--dot", p.color);

		const picker = document.createElement("color-picker-popover");
		picker.setAttribute("popover-only", "");
		picker.setAttribute("value", p.color);
		Object.assign(picker.style, {
			position: "absolute",
			left: "0",
			top: "0",
			width: "0",
			height: "0",
			display: "block",
		});

		function syncFromPicker() {
			const value = picker.value;
			if (!value || value === p.color) return;
			p.color = value;
			dot.style.setProperty("--dot", value);
			renderPreview();
			publishColors();
		}
		for (const type of [
			"change",
			"input",
			"click",
			"pointerup",
			"keyup",
			"focusout",
		]) {
			picker.addEventListener(type, syncFromPicker);
		}
		function place() {
			wrap.style.left = `${p.x * 100}%`;
			wrap.style.top = `${p.y * 100}%`;

			drawLines();

			picker.classList.toggle("flip-x", p.x > 0.5);
			picker.classList.toggle("flip-y", p.y > 0.5);
		}

		let drag = null;
		let swallowClick = false;

		dot.addEventListener("pointerdown", (e) => {
			if (e.button !== 0) {
				return;
			}
			swallowClick = false;
			const r = box.getBoundingClientRect();
			drag = {
				startX: e.clientX,
				startY: e.clientY,
				offX: r.left + p.x * r.width - e.clientX,
				offY: r.top + p.y * r.height - e.clientY,
				moved: false,
			};
			dot.setPointerCapture(e.pointerId);
		});

		dot.addEventListener("pointermove", (e) => {
			if (!drag) {
				return;
			}
			if (!drag.moved) {
				if (
					Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) <
					DRAG_THRESHOLD
				)
					return;
				drag.moved = true;
				dot.classList.add("is-dragging");
				customElements
					.get("color-picker-popper")
					?.openPicker?.togglePopover(false);
			}

			const r = box.getBoundingClientRect();
			p.x = clamp((e.clientX + drag.offX - r.left) / r.width, 0, 1);
			p.y = clamp((e.clientY + drag.offY - r.top) / r.height, 0, 1);
			place();
			renderPreview();
		});

		const endDrag = (e) => {
			if (!drag) return;
			swallowClick = drag.moved;
			drag = null;
			dot.classList.remove("is-dragging");
			if (dot.hasPointerCapture(e.pointerId)) {
				dot.releasePointerCapture(e.pointerId);
			}
		};

		dot.addEventListener("pointerup", endDrag);
		dot.addEventListener("pointercancel", endDrag);

		dot.addEventListener("click", (e) => {
			e.stopPropagation();
			if (swallowClick) {
				swallowClick = false;
				return;
			}
			picker.togglePopover?.();
		});

		dot.addEventListener("keydown", (e) => {
			const step = e.shiftKey ? 0.05 : 0.01;
			const move = {
				ArrowLeft: [-step, 0],
				ArrowRight: [step, 0],
				ArrowUp: [0, -step],
				ArrowDown: [0, step],
			}[e.key];

			if (!move) {
				return;
			}

			e.preventDefault();
			p.x = clamp(p.x + move[0], 0, 1);
			p.y = clamp(p.y + move[1], 0, 1);
			place();
			renderPreview();
		});
		wrap.append(dot, picker);
		box.append(wrap);
		place();
	});

	widthInput.addEventListener("input", renderPreview);
	heightInput.addEventListener("input", renderPreview);
	renderPreview();
	publishColors();

	return {
		getPoints: () => points.map(({x, y, color}) => ({x, y, color})),
	};
}
