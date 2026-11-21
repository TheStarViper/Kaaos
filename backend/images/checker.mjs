export async function renderCheckerPng({width,height,colorA,colorB,size=40}){
    const tile =document.createElement("canvas");
    tile.width = tile.height = size*2;
    const t = tile.getContext("2d");

    t.fillStyle = colorA;
    t.fillRect(0, 0, size * 2, size * 2);
    t.fillStyle = colorB;
    t.fillRect(size, 0, size, size);
    t.fillRect(0, size, size, size);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx){
        throw new Error(
			"Canvas isnt available in this browser (ur either on mobile or on an OLD ASF BROWSER UNC)",
		);
    }
    ctx.fillStyle = ctx.createPattern(tile,"repeat");
    ctx.fillRect(0,0,width,height);

    const blob = await new Promise((resolve)=>canvas.toBlob(resolve,"image/png"));
    if (!blob){
        throw new Error(
			"Couldnt create the image (might be too big for this browser)",
		);
    }
    return new Uint8Array(await blob.arrayBuffer());
}