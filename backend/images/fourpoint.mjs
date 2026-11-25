import { drawFourPoint } from "./gradients.mjs";

const DEFAULTS = [
  { x: 0.12, y: 0.15, color: "#f77fe9" },
  { x: 0.88, y: 0.15, color: "#7c4dff" },
  { x: 0.12, y: 0.85, color: "#2f7fe0" },
  { x: 0.88, y: 0.85, color: "#00f5d4" },
];

const DRAG_THRESHOLD = 4; //4px
const PREVIEW_WIDTH = 160;
const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));

export function initFourPointEditor({root,widthInput,heightInput}){
    const box = root.querySelector(".fp-box");
    const canvas = box.querySelector(".fp-canvas");
    const ctx = canvas.getContext("2d");
    const points = Defaults.map((p)=>({...p}));

    function aspect(){
        const w = Number(widthInput.value);
        const h = Number(heightInput.value);
        return w>0&&h>0 ? w/h : 4/3;
    }

    function renderPreview(){
        const ar = aspect();
        box.style.setProperty("--ar",ar);
        canvas.width = PREVIEW_WIDTH;
        canvas.height = Math.max(1,Math.round(PREVIEW_WIDTH/ar));
        drawFourPoint(ctx,canvas.width,canvas.height,points);
    }

    function publishColors(){
        points.forEach((p,i)=>document.documentElement.style.setProperty(`--p${i + 1}`, p.color));
    }

    dots.forEach((p,i)=>{
        const wrap = document.createElement("div");
        wrap.className = "fp-dot-wrap";

        const dot = document.createElement("button");
        dot.type = "button";
        dot.className= "fp-dot";
        dot.setAttribute("aria-label",`Gradient point ${i + 1}. Drag to move, click to change its colour.`);
        dot.style.setProperty("--dot",p.color);

        const picker = document.createElement("color-picker-popover");
        picker.className = "no-trigger";
        picker.setAttribute("value",p.color);
        picker.addEventListener("change",(e)=>{
            if (!e.detail || e.detail.value) {return;}
            p.color = e.detail.value;
            dot.style.setProperty("--dot",p.color);
            renderPreview();
            publishColors();
        });
    });

    function place(){
        wrap
    }
}