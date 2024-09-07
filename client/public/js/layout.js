let isOrderedForMobile = false;
let isOrderedForDesktop = false;
document.addEventListener("DOMContentLoaded", function() {
    if (window.innerWidth < 900) {
        reOrderLayoutForMobile();    
        isOrderedForMobile = true;
    }else{
        // default layout is for desktop
        isOrderedForDesktop = true
    }
});

window.addEventListener("resize", function() {
    if (window.innerWidth < 900) {
        if(!isOrderedForMobile) reOrderLayoutForMobile();  
        isOrderedForMobile = true;  
        isOrderedForDesktop = false;
    } else {
        if(!isOrderedForDesktop) reOrderLayoutForDesktop();
        isOrderedForDesktop = true;
        isOrderedForMobile = false;
    }
});

function reOrderLayoutForMobile(){
    document.querySelector(".right").append(
        document.querySelector("#board-editor")
    );

    if(document.querySelector("#piece-creator"))
        return;

    document.querySelector("#chessboard").before(
        document.querySelector(".player-section")
    );

    document.querySelector("#chessboard").after(
        document.querySelector(".player-section:not(:first-of-type)")
    );
}

function reOrderLayoutForDesktop(){
    document.querySelector(".center").append(
        document.querySelector("#board-editor")
    );
    
    if(document.querySelector("#piece-creator"))
        return;

    document.querySelector("#notation-menu").prepend(
        document.querySelector(".player-section")
    );

    document.querySelector("#notation-menu").append(
        document.querySelector(".player-section")
    );
}