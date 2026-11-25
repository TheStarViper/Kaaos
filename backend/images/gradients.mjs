import { hexToRgb,pack,sRgbToLinear,linearToSRgb} from "../utils.mjs";

function fourCorner(ctx,width,height,points){
    const image = ctx.createImageData(width,height);
    const px = new Uint32Array(image.data.buffer);
    const n = points.length;
    const X = new Float64Array(n);
    const Y = new Float64Array(n);
    const R = new Float64Array(n);
    const G = new Float64Array(n);
    const B = new Float64Array(n);

    points.forEach((p,i) => {
        X[i] = p.x*(width-1);
        Y[i] = p.y*(height-1);
        [R[i],G[i],B[i]] = hexToRgb(p.color);
    });

    const soft = 0.09*Math.hypot(width,height);
    const s2 = soft*soft;
    const dy2 = new Float64Array(n);

    for (let y = 0;y<height;y++){
        for (let i = 0; i < n; i++) dy2[i] = (y - Y[i]) * (y - Y[i]) + s2;
        for (let x = 0; x<width;x++){
            let sw = 0, sr = 0, sg = 0, sb = 0;
            for (let i =0; i<n;i++){
                const dx = x - X[i];
                const w = 1/(dx*dx+dy2[i]);
                sw+=w;
                sr+=w*R[i];
                sg+=w*G[i];
                sb+=w*B[i];
            }
            px[y*width+x] = pack(((sr / sw) + 0.5) | 0, ((sg / sw) + 0.5) | 0, ((sb / sw) + 0.5) | 0);
        }
    }
    ctx.putImageData(image,0,0);
}

export async function renderBasicPng({width,height,kind,colors,points}){
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
        if (!points || points.length < 2) {
            throw new Error("The gradient points are missing.");
        }
        fourCorner(ctx,width,height,points);
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