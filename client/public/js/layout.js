// Layout.js is responsible for reordering the layout 
// of the page based on the screen size.

const left = document.querySelector(".left");
const center = document.querySelector(".center");
const right = document.querySelector(".right");
const boardCreator = document.getElementById("board-creator");
const navbarComponents = [
    document.getElementById("navbar"),
    document.getElementById("log-console"),
    document.getElementById("appearance-menu"),
    document.getElementById("settings-menu"),
    document.getElementById("about-menu")
]

let breakpointCircle = true;
document.addEventListener("DOMContentLoaded", () => {
    reorder(true);

    window.addEventListener("resize", () => {
        reorder();   
    });
});

const reorder = (isFirstTime = false) => {
    const isMobile = window.innerWidth < 900;
    const isTablet = window.innerWidth >= 900 && window.innerWidth < 1250;
    const isDesktop = window.innerWidth >= 1250;
    
    if(isMobile && (breakpointCircle || isFirstTime)){
        reorderLayoutForMobile();
        breakpointCircle = false;
    } else if(isTablet && (!breakpointCircle || isFirstTime)){
        reorderLayoutForTablet();
        breakpointCircle = true;
    } else if(isDesktop && (breakpointCircle || isFirstTime)){
        reorderLayoutForDesktop();
        breakpointCircle = false;
    }
}

const reorderLayoutForMobile = () => {
    right.append(boardCreator);
    left.append(...navbarComponents);
}

const reorderLayoutForTablet = () => {
    center.append(...navbarComponents);
    center.prepend(boardCreator);
}

const reorderLayoutForDesktop = () => {
    center.append(boardCreator);
    left.append(...navbarComponents);
}