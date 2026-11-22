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
    
}