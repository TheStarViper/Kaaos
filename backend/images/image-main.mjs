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

form.addEventListener("submit",async(events)=>{
    events.preventDefault();
    
    const width = clampSize($("img-width").value);
    const height = clampSize($("img-height").value);
    if (!width || !height){
        setStatus("Enter a width and height between 1-4000",true);
        return;
    }
    
    $("img-width").value = width;
    $("img-height").value = height;

    const format = $("img-format").value;
    button.disabled=true;
    setStatus("Loading Imagemagick");

    try{
        const lib = await loadMagick();
        setStatus("Generating");

        await new Promise((r)=>requestAnimationFrame(()=>setTimeout(r,0)));
        const started = performance.now();
        const bytes = render(lib,{
            width,
            height,
            format,
            style: form.elements.style.value,
            c1: color1.value,
            c2: color2.value,
        });

        if (!bytes||!bytes.length) {throw new Error("No image data was produced");}
        const blob = new Blob([bytes],{type:MIME[format]});
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        objectUrl = URL.createObjectURL(blob);

        const filename = `${fileBase()}.${format}`;
        preview.alt = `Generated ${width} by ${height} ${format.toUpperCase()} image`;
        preview.src = objectUrl;
        download.href = objectUrl;
        download.download = filename;
        meta.textContent =
        `${filename} · ${width}×${height} · ${(blob.size / 1024).toFixed(1)} KB` +
        (format === "tiff" ? " · browsers can't preview TIFF, but the download works" : "");

        result.hidden = false;
        setStatus(`Done in ${Math.round(performance.now()-started)} ms.`);
    } catch (error){
        console.error(error);
        setStatus(`Something went wrong: ${err.message || err}`, true);
    } finally {
        button.disabled = false;
    }
});