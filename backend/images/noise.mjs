import {buildField} from "./topo.mjs";

function hexToRgb(hex){
    const h = String(hex).replace("#","");
    return [0,2,4].map((i)=>parseInt(h.slice(i,i+2),16)||0);
}

const clamp = (v)=>(v<0?0:v>255?255:v|0);
const pack = (r,g,b)=>(255<<24)|(b<<16)|(g<<8)|r;

function gaussian(){
    const u =1-Math.random();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*Math.random());
}

function drawClouds(ctx,width,height,colorA,colorB){
    const cell = Math.max(2,Math.ceil(Math.max(width,height)/600));
    const cols = Math.ceil(width/cell);
    const rows = Math.ceil(height/cell);
    const stride = cols+1;
    const field = buildField(cols,rows,4,Math.floor(Math.random()*1_000_000),0);

    const small = document.createElement("canvas");
    small.width=cols;
    small.height=rows;
    const sctx = small.getContext("2d");
    const img = sctx.createImageData(cols,rows);
    const px  = new Uint8Array(img.data.buffer);
    const [r1,g1,b1] = hexToRgb(colorA);
    const [r2,g2,b2] = hexToRgb(colorB);

    for(let j = 0; j<rows; j++){
        for(let i =0;i<cols;i++){
            const t = field[j*stride+i];
            px[j*cols*i]=pack(
                clamp(r1 + (r2 - r1) * t),
                clamp(g1 + (g2 - g1) * t),
                clamp(b1 + (b2 - b1) * t)
            );
        }
    }

    sctx.putImageData(img,0,0);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(small,0,0,cols*cell,rows*cell);
}

export async function renderNoisePng({width,height,kind,colorA,colorB}){
    
}