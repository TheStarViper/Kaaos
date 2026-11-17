const navOrder = [
    "index.html",
    "images.html", 
    "docs.html", 
    "audio.html", 
    "video.html", 
    "settings.html", 
    "about.html"
];

function getPageIndex(pathname){
    const file = pathname.split("/").pop() || "index.html";
    return navOrder.indexOf(file);
}

let isnavigating = false;

window.addEventListener('pageswap',async(e)=>{
    if (e.viewTransition){
        const currentindex = getPageIndex(location.pathname);
        const targetindex = getPageIndex(e.destination.url);

        if (currentindex !==-1 && targetindex !==-1){
            const directionType = targetindex > currentindex ? 'slide-left' : 'slide-right';
            e.viewTransition.types.add(directionType);
        }
    }
});

window.addEventListener('pagereveal',async(e)=>{
    if(e.viewTransition&&navigation.activation){
        const fromurl = navigation.activation.from?.url;
        if (fromurl){
            const currentindex = getPageIndex(location.pathname);
            const previndex = getPageIndex(fromurl);

            if (currentindex !==-1&& previndex !==-1){
                const directionType = currentindex > previndex ? 'slide-left' : 'slide-right';
                e.viewTransition.types.add(directionType);
            }
        }
    }
});

document.addEventListener('click', (e) => {
    const link = e.target.closest('a.tab, a.brand');
    if (link) {
        if (isnavigating) {
            e.preventDefault();
        } else {
            isnavigating = true;
        }
    }
});

window.addEventListener('pageshow',()=>{
    isnavigating = false;
})