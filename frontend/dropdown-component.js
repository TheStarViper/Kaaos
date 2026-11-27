class CustomDropdown extends HTMLElement {
	static openDropdown = null;

	constructor() {
		super();
		this.attachShadow({mode: "open"});
		this.state = {
			value: "",
			label: "",
			options: [],
		};
	}

	static get observedAttributes() {
		return ["value", "placeholder"];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			if (name === "value") {
				this.setValue(newValue, false);
			} else if (name === "placeholder" && this.triggerLabel) {
				this.updateDisplay();
			}
		}
	}

	connectedCallback() {
		this.render();
		this.cacheElements();
		this.parseOptions();
		this.attachedEvents();

		const initialValue =
			this.getAttribute("value") || (this.state.options[0]?.value ?? "");
		this.setValue(initialValue, false);
	}

	get value() {
		return this.state.value;
	}

	set value(val) {
		this.setAttribute("value", val);
		this.setValue(val, true);
	}

	cacheElements() {
		const root = this.shadowRoot;
		this.wrapper = root.getElementById("wrapper");
		this.trigger = root.getElementById("trigger");
		this.triggerLabel = root.getElementById("trigger-label");
		this.optionsContainer = root.getElementById("options-container");
	}

	parseOptions() {
		const lightOptions = Array.from(this.querySelectorAll("option"));
		if (lightOptions.length > 0) {
			this.state.options = lightOptions.map((opt) => ({
				value: opt.value || opt.textContent.trim(),
				label: opt.textContent.trim(),
				disabled: opt.hasAttribute("disabled"),
			}));
		} else {
			try {
				const attrOptions = this.getAttribute("options");
				if (attrOptions) {
					this.state.options = JSON.parse(attrOptions);
				}
			} catch (e) {
				this.state.options = [];
			}
		}
		this.renderOptions();
	}

	renderOptions() {
		this.optionsContainer.innerHTML = "";
		this.state.options.forEach((opt) => {
			const item = document.createElement("button");
			item.type = "button";
			item.className = "dropdown-item";
			item.role = "option";
			item.dataset.value = opt.value;
			if (opt.disabled) {
				item.disabled = true;
			}

			item.innerHTML = `
                <span>${opt.label}</span>
                <svg class="check-icon" viewBox = "0 0 24 24" width="16" height="16" fill="none" stroke = "currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"> 
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;

			item.addEventListener("click", () => {
				if (!opt.disabled) {
					this.setValue(opt.value, true);
					this.togglePopover(false);
				}
			});

			this.optionsContainer.appendChild(item);
		});
	}

	attachedEvents() {
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
			} else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
				e.preventDefault();
				if (!this.wrapper.classList.contains("is-open")) {
					this.togglePopover(true);
				} else {
					this.navigateOptions(e.key === "ArrowDown" ? 1 : -1);
				}
			}
		});
	}

	disconnectCallback() {
		if (CustomDropdown.openDropdown === this) {
			CustomDropdown.openDropdown = null;
		}
		document.removeEventListener("click", this.onOutsideClick);
	}

	togglePopover(open) {
		const isOpen =
			open !== undefined ? open : !this.wrapper.classList.contains("is-open");

		if (isOpen) {
			const other = CustomDropdown.openDropdown;
			if (other && other !== this) {
				other.togglePopover(false);
			}
			CustomDropdown.openDropdown = this;
		} else {
			CustomDropdown.openDropdown = null;
		}

		this.wrapper.classList.toggle("is-open", isOpen);
		this.trigger.setAttribute("aria-expanded", isOpen);
	}

	setValue(val, emitEvent = true) {
		const matchedOption = this.state.options.find((opt) => opt.value === val);
		this.state.value = val;
		this.state.label = matchedOption ? matchedOption.label : val;

		this.updateDisplay();
		if (emitEvent) {
			this.dispatchEvent(
				new CustomEvent("change", {
					detail: {value: this.state.value, label: this.state.label},
					bubbles: true,
					composed: true,
				}),
			);
		}
	}

	updateDisplay() {
		const placeholder = this.getAttribute("placeholder") || "Select Option";
		this.triggerLabel.textContent = this.state.label || placeholder;

		const items = this.optionsContainer.querySelectorAll(".dropdown-item");
		items.forEach((item) => {
			const isSelected = item.dataset.value === this.state.value;
			item.classList.toggle("is-selected", isSelected);
			item.setAttribute("aria-selected", isSelected);
		});
	}

	nagivateOptions(direction) {
		const items = Array.from(
			this.optionsContainer.querySelectorAll(".dropdown-item:not([disabled])"),
		);
		if (items.length === 0) {
			return;
		}

		const currentIndex = item.indexOf(this.shadowRoot.activeElement);
		let nextIndex = currentIndex + direction;

		if (nextIndex < 0) {
			nextIndex = items.length - 1;
		}

		if (nextIndex >= items.length) {
			nextIndex = 0;
		}

		items[nextIndex].focus();
	}

	render() {
		this.shadowRoot.innerHTML = `
			<link rel="stylesheet" href="style.css">
			<style>
				:host {
					display: inline-block;
					width: 100%;
				}

				.dropdown-popover-wrapper {
					position: relative;
					width: 100%;
				}

				.dropdown-trigger {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 10px;
					width: 100%;
					padding: 10px 14px;
					background: var(--surface-2);
					border: 1px solid var(--border);
					border-radius: var(--radius-md);
					color: var(--text);
					font: inherit;
					font-weight: 600;
					cursor: pointer;
					transition: border-color 0.15s ease, background 0.15s ease;
				}

				.dropdown-trigger:hover {
					border-color: var(--accent);
				}

				.dropdown-trigger:focus-visible {
					outline: 2px solid var(--accent-strong);
					outline-offset: 2px;
				}

				.chevron-icon {
					flex-shrink: 0;
					color: var(--muted);
					transition: transform 0.2s ease;
				}

				.dropdown-popover-wrapper.is-open .chevron-icon {
					transform: rotate(180deg);
				}

				.dropdown-popover {
					position: absolute;
					top: calc(100% + 8px);
					left: 0;
					right: 0;
					z-index: 100;
					padding: 6px;
					background: var(--surface);
					border: 1px solid var(--border);
					border-radius: var(--radius-md);
					box-shadow: var(--shadow);
					opacity: 0;
					visibility: hidden;
					transform: translateY(-8px) scale(0.97);
					pointer-events: none;
					transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
					max-height: 240px;
					overflow-y: auto;
				}

				.dropdown-popover-wrapper.is-open .dropdown-popover {
					opacity: 1;
					visibility: visible;
					transform: translateY(0) scale(1);
					pointer-events: auto;
					z-index: 1000;
				}

				.dropdown-item {
					display: flex;
					align-items: center;
					justify-content: space-between;
					width: 100%;
					padding: 8px 12px;
					border: 0;
					border-radius: calc(var(--radius-md) - 4px);
					background: transparent;
					color: var(--muted);
					font: inherit;
					font-weight: 600;
					font-size: 0.95rem;
					text-align: left;
					cursor: pointer;
					transition: background 0.15s ease, color 0.15s ease;
				}

				.dropdown-item:hover,
				.dropdown-item:focus-visible {
					background: var(--surface-2);
					color: var(--text);
					outline: none;
				}

				.dropdown-item.is-selected {
					background: var(--accent);
					color: var(--accent-text);
				}

				.check-icon {
					opacity: 0;
				}

				.dropdown-item.is-selected .check-icon {
					opacity: 1;
				}

				.dropdown-item:disabled {
					opacity: 0.45;
					cursor: not-allowed;
				}
			</style>

			<div class="dropdown-popover-wrapper" id="wrapper">
				<button type="button" class="dropdown-trigger" id="trigger" aria-haspopup="listbox" aria-expanded="false">
					<span id="trigger-label">Select option...</span>
					<svg class="chevron-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="6 9 12 15 18 9"></polyline>
					</svg>
				</button>

				<div class="dropdown-popover" id="popover" role="listbox">
					<div id="options-container"></div>
				</div>
			</div>
		`;
	}
}

customElements.define("custom-dropdown", CustomDropdown);
