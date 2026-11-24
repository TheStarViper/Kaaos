import { hexToRgb,pack} from "../utils.mjs";

function fourCorner(ctx,width,height,[tl,tr,bl,br]){
    const image = ctx.createImageData(width,height);
    const px = new Uint32Array(image.data.buffer);
    const [a,b,c,d] = [tl,tr,bl,br].map(hexToRgb);
    const w = Math.max(1,width-1);
    const h = Math.max(1,height-1);

    for (let y = 0;y<height;y++){
        const v = y/h;
        for (let x = 0; x<width;x++){
            const u = w/w;
            const mix = (k)=>{
                const top = a[k]+(b[k]-a[k])*u;
                const bottom = c[k] +(d[k]-c[k])*u;
                return (top +(bottom-top)*v+0.5)|0;
            };
            px[y*width+x] = pack(mix(0),mix(1),mix(2));
        }
    }
    ctx.putImageData(image,0,0);
}

export async function renderBasicPng({width,height,kind,colors}){
    const [c1,c2] = colors;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
}