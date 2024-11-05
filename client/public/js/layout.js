// Layout.js is responsible for reordering the layout 
// of the page based on the screen size.

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
});

const reOrderLayoutForMobile = () => {
    document.querySelector(".right").append(
        document.getElementById("board-creator")
    );

    document.querySelector(".left").append(
        document.getElementById("navbar"),
        document.getElementById("log-console"),
        document.getElementById("appearance-menu"),
        document.getElementById("settings-menu"),
        document.getElementById("about-menu")
    );

    if(document.getElementById("piece-creator").innerHTML)
        return;
    
    const firstPlayerSection = document.querySelector(".player-section");
    if(firstPlayerSection){
        document.getElementById("chessboard").before(firstPlayerSection);
    }

    const secondPlayerSection = document.querySelector(".player-section:not(:first-child)");
    if(secondPlayerSection){
        document.getElementById("chessboard").before(secondPlayerSection);
    }
}

const reOrderLayoutForTablet = () => {
    document.querySelector(".center").append(
        document.getElementById("navbar"),
        document.getElementById("log-console"),
        document.getElementById("appearance-menu"),
        document.getElementById("settings-menu"),
        document.getElementById("about-menu")
    );

    document.querySelector(".center").prepend(
        document.getElementById("board-creator")
    );

    if(document.querySelector("#notation-menu .player-section"))
        return;

    const firstPlayerSection = document.querySelector(".player-section");
    if(firstPlayerSection){
        document.getElementById("notation-menu").prepend(
            firstPlayerSection
        );
    }

    const secondPlayerSection = document.querySelector(".player-section");
    if(secondPlayerSection){
        document.getElementById("notation-menu").append(
            secondPlayerSection
        );
    }
}

const reOrderLayoutForDesktop = () => {
    document.querySelector(".center").append(
        document.getElementById("board-creator")
    );

    document.querySelector(".left").append(
        document.getElementById("navbar"),
        document.getElementById("log-console"),
        document.getElementById("appearance-menu"),
        document.getElementById("settings-menu"),
        document.getElementById("about-menu")
    );
    
    if(document.getElementById("piece-creator").innerHTML || document.querySelector("#notation-menu .player-section"))
        return;

    const firstPlayerSection = document.querySelector(".player-section");
    if(firstPlayerSection){
        document.getElementById("notation-menu").prepend(
            firstPlayerSection
        );
    }
    
    const secondPlayerSection = document.querySelector(".player-section");
    if(secondPlayerSection){
        document.getElementById("notation-menu").append(
            secondPlayerSection
        );
    }
}