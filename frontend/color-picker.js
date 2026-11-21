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
})