let isOrderedForMobile = false;
let isOrderedForDesktop = false;
let isOrderedForTablet = false;
document.addEventListener("DOMContentLoaded", function() {
    if (window.innerWidth < 900){
        reOrderLayoutForMobile();    
        isOrderedForMobile = true;
    }
    else if(window.innerWidth < 1250){
        reOrderLayoutForTablet();
        isOrderedForTablet = true;   
    }
    else{
        // default layout is for desktop
        isOrderedForDesktop = true
    }
});

window.addEventListener("resize", function() {
    if (window.innerWidth < 900) {
        if(!isOrderedForMobile) reOrderLayoutForMobile();  
        isOrderedForMobile = true;  
        isOrderedForDesktop = false;
        isOrderedForTablet = false;
    } else if(window.innerWidth < 1250) {
        if(!isOrderedForTablet) reOrderLayoutForTablet();
        isOrderedForTablet = true;
        isOrderedForMobile = false;
        isOrderedForDesktop = false;
    }else{
        if(!isOrderedForDesktop) reOrderLayoutForDesktop();
        isOrderedForDesktop = true;
        isOrderedForMobile = false;
        isOrderedForTablet = false;
    }
});

function reOrderLayoutForMobile(){
    document.querySelector(".right").append(
        document.querySelector("#board-editor")
    );

    document.querySelector(".left").append(
        document.querySelector("#log-console")
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

function reOrderLayoutForTablet(){
    document.querySelector(".center").append(
        document.querySelector("#log-console")
    );

    document.querySelector(".center").prepend(
        document.querySelector("#board-editor")
    );

    if(document.querySelector("#notation-menu .player-section"))
        return;
    
    document.querySelector("#notation-menu").prepend(
        document.querySelector(".player-section")
    );

    document.querySelector("#notation-menu").append(
        document.querySelector(".player-section")
    );
}

function reOrderLayoutForDesktop(){
    document.querySelector(".center").append(
        document.querySelector("#board-editor")
    );

    document.querySelector(".left").append(
        document.querySelector("#log-console")
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