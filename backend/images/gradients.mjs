import { hexToRgb,pack,sRgbToLinear,linearToSRgb} from "../utils.mjs";

function fourCorner(ctx,width,height,points){
    const image = ctx.createImageData(width,height);
    const px = new Uint32Array(image.data.buffer);
    const n 

    for (let y = 0;y<height;y++){
        const v = y/h;
        for (let x = 0; x<width;x++){
            const u = x/w;
            const mix = (k)=>{
                const top = a[k]+(b[k]-a[k])*u;
                const bottom = c[k] +(d[k]-c[k])*u;
                const linearVal = top + (bottom-top)*v;
                return linearToSRgb(linearVal);
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
    if (!ctx) {
		throw new Error(
			"Canvas isnt available in this browser (ur either on mobile or on an OLD ASF BROWSER UNC)",
		);
	}

    if (kind==="fourcorner"){
        fourCorner(ctx,width,height,colors);
    } else {
        let fill;
        if (kind ==="solid"){
            fill = c1;
        } else if (kind==="hgradient"){
            fill = ctx.createLinearGradient(0,0,width,0);
            fill.addColorStop(0,c1);
            fill.addColorStop(1,c2);
        } else if (kind==="vgradient"){
            fill = ctx.createLinearGradient(0,0,0,height);
            fill.addColorStop(0,c1);
            fill.addColorStop(1,c2);
        } else if (kind==="radial"){
            const r = Math.hypot(width,height)/2;
            fill = ctx.createRadialGradient(width/2,height/2,0,width/2,height/2,r);
            fill.addColorStop(0,c1);
            fill.addColorStop(1,c2);
        } else if (kind==="conic"){
            if (!ctx.createConicGradient){
                throw new Error("Conic gradients need a more modern browser");
            }

            fill = ctx.createConicGradient(-Math.PI/2,width/2,height/2);
            fill.addColorStop(0,c1);
            fill.addColorStop(0.5,c2);
            fill.addColorStop(1,c1);
        } else {
            throw new Error(`Unknown fill: ${kind}`);
        }
        ctx.fillStyle = fill;
        ctx.fillRect(0,0,width,height);
    }

    const blob = await new Promise((resolve) =>
		canvas.toBlob(resolve, "image/png"),
	);
	if (!blob) {
		throw new Error(
			"Couldnt create the image (might be too big for this browser)",
		);
	}
	return new Uint8Array(await blob.arrayBuffer());
}