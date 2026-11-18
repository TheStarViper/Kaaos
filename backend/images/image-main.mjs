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

