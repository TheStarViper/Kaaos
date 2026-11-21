document.addEventListener("DOMContentLoaded",()=>{
    const wrapper = document.getElementById("img-color1-wrapper");
    const trigger = document.getElementById("img-color1-trigger");
    const previewSwatch = document.getElementById("img-color1-preview");
    const labelText = document.getElementById("img-color1-label");

    const satValBox = document.getElementById("sat-val-box");
    const satValPointer = document.getElementById("sat-val-pointer");
    const hueRange = document.getElementById("hue-range");
    const alphaRange = document.getElementById("alpha-range");
    const hexInput = document.getElementById("img-color1");
    const alphaInput = document.getElementById("alpha-input");
    const swatches = wrapper.querySelectorAll(".swatch");

    let state = {
        h: 300,
        s: 0.48,
        v: 0.97,
        a: 1
    };

    function togglePopover(open){
        const isOpen = open !==undefined ? open : !wrapper.classList.contains("is-open");
        wrapper.classList.toggle("is-open",isOpen);
        trigger.setAttribute("aria-expanded",isOpen);
    }

    trigger.addEventListener("click",(e)=>{
        e.stopPropagation();
        togglePopover();
    });

    document.addEventListener("click",(e)=>{
        if (!wrapper.contains(e.target)) {
            togglePopover(false);
        }
    });

    wrapper.addEventListener("keydown",(e)=>{
        if(e.key==="Escape"){
            togglePopover(false);
            trigger.focus();
        }
    });

    function hsvToRgb(h, s, v) {
        let f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
        return [
        Math.round(f(5) * 255),
        Math.round(f(3) * 255),
        Math.round(f(1) * 255)
        ];
    }

    function rgbToHex(r, g, b, a) {
        let toHex = (n) => n.toString(16).padStart(2, '0').toUpperCase();
        let alphaHex = Math.round(a * 255) < 255 ? toHex(Math.round(a * 255)) : '';
        return `#${toHex(r)}${toHex(g)}${toHex(b)}${alphaHex}`;
    }

    function updatePickerUI(){
        satValBox.style.backgroundColor=`hsl(${state.h},100%,50%)`;
        satValPointer.style.left=`${state.s*100}%`;
        satValPointer.style.top = `${(1-state.v)*100}%`;

        hueRange.value = state.h;
        alphaRange.value = Math.round(state.a*100);

        const [r,g,b] = hsvToRgb(state.h,state.s,state.v);
        const hex = rgbToHex(r,g,b,state.a);

        hexInput.value = hex;
        alphaInput.value = `${Math.round(state.a*100)}%`;
        labelText.textContent = hex;

        const displayCssColor = state.a<1?`rgba(${r}, ${g}, ${b}, ${state.a})` : hex;
        previewSwatch.style.backgroundColor = displayCssColor;
        document.documentElement.style.setProperty('--picker-color', `rgb(${r}, ${g}, ${b})`);

        hexInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    function handleSatValMove(e){
        const rect = satValBox.getBoundingClientRect();
        let x = Math.max(0,Math.min(rect.width,e.clientX-rect.left));
        let y = Math.max(0,Math.min(rect.height,e.clientY-rect.top));

        
    }
})