class ColorPickerPopover extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({mode: "open"});

		this.state = {
			h: 300,
			s: 0.48,
			v: 0.97,
			a: 1,
		};

		this.isDragging = false;
	}

	static get observedAttributes() {
		return ["value", "name"];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && name === "value") {
			this.setColorFromHex(newValue);
		}
	}

	connectedCallback() {
		this.render();
		this.cacheElements();
		this.attachEvents();

		const initialVal = this.getAttribute("value") || "#F77FE9";
		this.setColorFromHex(initialVal);
	}

	get value() {
		const [r, g, b] = this.hsvToRgb(this.state.h, this.state.s, this.state.v);
		return this.rgbToHex(r, g, b, this.state.a);
	}

	set value(val) {
		this.setAttribute("value", val);
		this.setColorFromHex(val);
	}

	cacheElements() {
		const root = this.shadowRoot;
		this.wrapper = root.getElementById("wrapper");
		this.trigger = root.getElementById("trigger");
		this.previewSwatch = root.getElementById("preview-swatch");
		this.labelText = root.getElementById("label-text");
		this.satValBox = root.getElementById("sat-val-box");
		this.satValPointer = root.getElementById("sat-val-pointer");
		this.hueRange = root.getElementById("hue-range");
		this.alphaRange = root.getElementById("alpha-range");
		this.hexInput = root.getElementById("hex-input");
		this.alphaInput = root.getElementById("alpha-input");
		this.swatches = root.querySelectorAll(".swatch");
	}

	attachEvents() {
		this.trigger.addEventListener("click", (e) => {
			e.stopPropagation();
			this.togglePopover();
		});

		this.onOutsideClick = (e) => {
			if (!this.contains(e.target)) {
				this.togglePopover(false);
			}
		};
		document.addEventListener("click", this.onOutsideClick);

		this.wrapper.addEventListener("keydown", (e) => {
			if (e.key === "Escape") {
				this.togglePopover(false);
				this.trigger.focus();
			}
		});

		this.satValBox.addEventListener("mousedown", (e) => {
			this.isDragging = true;
			this.handleSatValMove(e);
		});

		this.onMouseMove = (e) => {
			if (this.isDragging) this.handleSatValMove(e);
		};
		this.onMouseUp = () => {
			this.isDragging = false;
		};

		window.addEventListener("mousemove", this.onMouseMove);
		window.addEventListener("mouseup", this.onMouseUp);

		this.hueRange.addEventListener("input", (e) => {
			this.state.h = parseFloat(e.target.value);
			this.updatePickerUI();
		});

		this.alphaRange.addEventListener("input", (e) => {
			this.state.a = parseFloat(e.target.value) / 100;
			this.updatePickerUI();
		});

		this.swatches.forEach((swatch) => {
			swatch.addEventListener("click", () => {
				this.setColorFromHex(swatch.dataset.color);
			});
		});

		this.hexInput.addEventListener("change", (e) => {
			let val = e.target.value.trim();
			if (!val.startsWith("#")) val = "#" + val;
			if (/^#([0-9A-F]{3,4}|[0-9A-F]{6}|[0-9A-F]{8})$/i.test(val)) {
				this.setColorFromHex(val);
			}
		});
	}

	disconnectedCallback() {
		document.removeEventListener("click", this.onOutsideClick);
		window.removeEventListener("mousemove", this.onMouseMove);
		window.removeEventListener("mouseup", this.onMouseUp);
	}

	togglePopover(open) {
		const isOpen =
			open !== undefined ? open : !this.wrapper.classList.contains("is-open");
		this.wrapper.classList.toggle("is-open", isOpen);
		this.trigger.setAttribute("aria-expanded", isOpen);
	}

	hsvToRgb(h, s, v) {
		let f = (n, k = (n + h / 60) % 6) =>
			v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
		return [
			Math.round(f(5) * 255),
			Math.round(f(3) * 255),
			Math.round(f(1) * 255),
		];
	}

	rgbToHex(r, g, b, a) {
		let toHex = (n) => n.toString(16).padStart(2, "0").toUpperCase();
		let alphaHex = Math.round(a * 255) < 255 ? toHex(Math.round(a * 255)) : "";
		return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
	}

	setColorFromHex(hex) {
		let val = hex.trim();
		if (!val.startsWith("#")) val = "#" + val;

		let r = 0,
			g = 0,
			b = 0,
			a = 1;

		if (val.length === 4 || val.length === 5) {
			r = parseInt(val[1] + val[1], 16);
			g = parseInt(val[2] + val[2], 16);
			b = parseInt(val[3] + val[3], 16);
			if (val.length === 5) a = parseInt(val[4] + val[4], 16) / 255;
		} else if (val.length === 7 || val.length === 9) {
			r = parseInt(val.slice(1, 3), 16);
			g = parseInt(val.slice(3, 5), 16);
			b = parseInt(val.slice(5, 7), 16);
			if (val.length === 9) a = parseInt(val.slice(7, 9), 16) / 255;
		}

		let max = Math.max(r, g, b) / 255,
			min = Math.min(r, g, b) / 255;
		let d = max - min;

		this.state.v = max;
		this.state.s = max === 0 ? 0 : d / max;
		this.state.a = a;

		if (d !== 0) {
			let rNorm = r / 255,
				gNorm = g / 255,
				bNorm = b / 255;
			if (max === rNorm)
				this.state.h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) * 60;
			else if (max === gNorm) this.state.h = ((bNorm - rNorm) / d + 2) * 60;
			else if (max === bNorm) this.state.h = ((rNorm - gNorm) / d + 4) * 60;
		}

		this.updatePickerUI();
	}

	handleSatValMove(e) {
		const rect = this.satValBox.getBoundingClientRect();
		let x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
		let y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

		this.state.s = x / rect.width;
		this.state.v = 1 - y / rect.height;
		this.updatePickerUI();
	}

	updatePickerUI() {
		this.satValBox.style.backgroundColor = `hsl(${this.state.h}, 100%, 50%)`;
		this.satValPointer.style.left = `${this.state.s * 100}%`;
		this.satValPointer.style.top = `${(1 - this.state.v) * 100}%`;

		this.hueRange.value = this.state.h;
		this.alphaRange.value = Math.round(this.state.a * 100);

		const [r, g, b] = this.hsvToRgb(this.state.h, this.state.s, this.state.v);
		const hex = this.rgbToHex(r, g, b, this.state.a);

		this.hexInput.value = hex;
		this.alphaInput.value = `${Math.round(this.state.a * 100)}%`;
		this.labelText.textContent = hex;

		const displayCssColor =
			this.state.a < 1 ? `rgba(${r}, ${g}, ${b}, ${this.state.a})` : hex;
		this.previewSwatch.style.backgroundColor = displayCssColor;

		this.style.setProperty("--picker-color", `rgb(${r}, ${g}, ${b})`);

		this.dispatchEvent(
			new CustomEvent("change", {
				detail: {value: hex, r, g, b, a: this.state.a},
				bubbles: true,
				composed: true,
			}),
		);
	}

	render() {
		this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="style.css">

      <div class="color-picker-popover-wrapper" id="wrapper">
        <button type="button" class="color-picker-trigger" id="trigger" aria-haspopup="true" aria-expanded="false">
          <span class="color-preview-swatch" id="preview-swatch"></span>
          <span class="color-hex-label" id="label-text">#F77FE9</span>
        </button>

        <div class="color-picker-popover" id="popover" role="dialog" aria-label="Choose color">
          <div class="custom-color-picker">
            <div class="picker-sat-val" id="sat-val-box">
              <div class="sat-val-pointer" id="sat-val-pointer"></div>
            </div>

            <div class="picker-slider-wrapper">
              <input
                type="range"
                class="picker-range hue-range"
                id="hue-range"
                min="0"
                max="360"
                value="300"
              />
            </div>

            <div class="picker-slider-wrapper alpha-bg">
              <input
                type="range"
                class="picker-range alpha-range"
                id="alpha-range"
                min="0"
                max="100"
                value="100"
              />
            </div>

            <div class="picker-inputs">
              <div class="input-col">
                <span class="input-hint">HEX</span>
                <input
                  type="text"
                  class="input color-hex-input"
                  id="hex-input"
                  value="#F77FE9"
                  maxlength="9"
                />
              </div>
              <div class="input-col">
                <span class="input-hint">ALPHA</span>
                <input
                  type="text"
                  class="input color-alpha-input"
                  id="alpha-input"
                  value="100%"
                  readonly
                />
              </div>
            </div>

            <div class="picker-swatches">
              <button type="button" class="swatch" style="background: #f77fe9;" data-color="#f77fe9" aria-label="Pink"></button>
              <button type="button" class="swatch" style="background: #341294;" data-color="#341294" aria-label="Purple"></button>
              <button type="button" class="swatch" style="background: #2f7fe0;" data-color="#2f7fe0" aria-label="Blue"></button>
              <button type="button" class="swatch" style="background: #00f5d4;" data-color="#00f5d4" aria-label="Cyan"></button>
              <button type="button" class="swatch" style="background: #ff007f;" data-color="#ff007f" aria-label="Magenta"></button>
            </div>
          </div>
        </div>
      </div>
    `;
	}
}

customElements.define("color-picker-popover", ColorPickerPopover);