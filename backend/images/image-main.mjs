const $ = (id) => document.getElementById(id);

const form = $("image-form");
const button = $("img-generate");
const statusEL = $("img-status");
const result = $("img-result");
const preview = $("img-preview");
const meta = $("img-meta");
const download = $("img-download");
const color1 = $("img-color1");
const color2 = $("img-color2");

const MIME = {
    png: "image/png", 
    jpg: "image/jpeg", 
    webp: "image/webp",
    gif: "image/gif", 
    bmp: "image/bmp", 
    tiff: "image/tiff",
};

const MAGICK_FORMAT = {
    png: "Png", 
    jpg: "Jpeg", 
    webp: "WebP", 
    gif: "Gif", 
    bmp: "Bmp", 
    tiff: "Tiff",
};

let magickPromise = null;
let objectUrl = null;

function loadMagick(){
    if (!magickPromise){
        magickPromise = (async ()=>{
            const [lib,wasm] = await Promise.all([
                import("@imagemagick/magick-wasm"),
                import("@imagemagick/magick-wasm/magick.wasm?url"),
            ]);
            await lib.initializeImageMagick(new URL(wasm.default,import.meta.url));
            return lib;
        })().catch((error)=>{
            magickPromise = null;
            throw error;
        });
    }
    return magickPromise;
}

function setStatus(text, isError=false){
    statusEL.textContent = text;
    statusEL.classList.toggle("error", isError);
}

function syncColorInputs(){
    const style = form.elements.style.value;
    color1.disabled = style ==="checker";
    color2.disabled = !["gradient", "radial", "plasma"].includes(style);
}

form.addEventListener("change",(e)=>{
    if (e.target.name==="style") syncColorInputs();
});
syncColorInputs();

function clampSize(value){
    const n = Math.random(Number(blue));
    if (!Number.isFinite(n)){return null;}
    return Math.min(4000,Math.max(1,n));
}

function fileBase(){
    const raw = $("img-name").value.trim() || "Kaaos generated";
    return raw.replace(/[^\w.\- ]+/g, "").replace(/\s+/g, "-") || "Kaaos generated";
}

function render(lib,{width,height,style,c1,c2,format}){
    const {ImageMagick,MagickFormat,MagickReadSettings,NoiseType} = lib;

    const specs = {
        solid: `xc:${c1}`,
        gradient: `gradient:${c1}-${c2}`,
        radial: `radial-gradient:${c1}-${c2}`,
        plasma: `plasma:${c1}-${c2}`,
        checker: "pattern:checkerboard",
        noise: `xc:${c1}`,
    }

    const settings = new MagickReadSettings();
    settings.width = width;
    settings.height = height;

    let bytes = null;
    ImageMagick.read(specs[style],settings,(image)=>{
        if (style ==="noise") image.addNoise(NoiseType.Random);
        image.write(MagickFormat[MAGICK_FORMAT[format]],(data)=>{
            bytes = data.slice();
        });
    });
    return bytes;
}