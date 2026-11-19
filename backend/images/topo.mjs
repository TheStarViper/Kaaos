function mulberry32(seed){
    let a = seed>>>0;
    return ()=>{
        a = (a+0x6d2b79f5)>>>0;
        let t = a;
        t = Math.imul(t^(t>>>15),t|1);
        t^= t+Math.imul(t^(t>>>7),t|61);
        return ((t^(t>>>14))>>>0)/4294967296;
    };
}

function makeNoise(rand){
    const p = Array.from({length:256},(_,i)=>i);
    for (let i =255;i>0;i--){
        const j =Math.floor(rand()*(i+1));
        [p[i],p[j]]=[p[j],p[i]];
    }

    const perm =new Uint8Array(512);
    for (let i = 0; i<512;i++){perm[i]=p[i&255];}

    const fade = (t)=>t*t*t*(t*(t*6-15)+10);
    const lerp = (a,b,t) => a+t*(b-a);
    const grad = (h,x,y) => {
        switch (h&7){
            case 0: return x + y;
            case 1: return -x + y;
            case 2: return x - y;
            case 3: return -x - y;
            case 4: return x;
            case 5: return -x;
            case 6: return y;
            default: return -y;
        }
    };

    return (x,y)=>{
        const xi = Math.floor(x),yi=math.floor(y);
        const xf = x-xi,yf = y-yi;
        const X = xi&255, Y = yi&255;
        const u = fade(xf),v=fade(yf);
        const aa = perm[perm[X]+Y],ab=perm[perm[X+1]+Y+1];
        return lerp(
            lerp(grad(aa,xf,yf),grad(ba,xf-1,yf),u),
            lerp(grad(ab,xf,yf-1),grad(bb,xf-1,yf-1),u)m,
            v
        );
    };
}

