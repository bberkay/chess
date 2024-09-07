document.addEventListener("DOMContentLoaded", function() {
    if (window.innerWidth < 900) {
        reOrderLayoutForMobile();    
    }
});

window.addEventListener("resize", function() {
    if (window.innerWidth < 900) {
        reOrderLayoutForMobile();    
    } else {
        reOrderLayoutForDesktop();
    }
});


function copyToClipboard(selector){
    const element = document.querySelector(selector);
    navigator.clipboard.writeText(element.tagName === "INPUT" ? element.value : element.textContent);
    element.select();
    element.parentElement.querySelector("button").textContent = "Copied!";
}

function reOrderLayoutForMobile(){
    document.querySelector(".right").append(
        document.querySelector("#board-editor")
    );

    if(document.querySelector("#piece-creator"))
        return;

    document.querySelector("#chessboard").before(
        document.querySelector("#black-player-section")
    );

    document.querySelector("#chessboard").after(
        document.querySelector("#white-player-section")
    );
}

function reOrderLayoutForDesktop(){
    document.querySelector(".center").append(
        document.querySelector("#board-editor")
    );
    
    if(document.querySelector("#piece-creator"))
        return;

    document.querySelector("#notation-menu").append(
        document.querySelector("#white-player-section")
    );

    document.querySelector("#notation-menu").prepend(
        document.querySelector("#black-player-section")
    );
}