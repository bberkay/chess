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
    if(document.querySelector("#notation-menu") == null)
        return;

    document.querySelector(".right").append(
        document.querySelector("#board-editor")
    );

    document.querySelector("#chessboard").before(
        document.querySelector("#black-player-score-section")
    );

    document.querySelector("#chessboard").after(
        document.querySelector("#white-player-score-section")
    );
}

function reOrderLayoutForDesktop(){
    if(document.querySelector("#notation-menu") == null)
        return;

    document.querySelector(".center").append(
        document.querySelector("#board-editor")
    );

    document.querySelector("#notation-menu").append(
        document.querySelector("#white-player-score-section")
    );

    document.querySelector("#notation-menu").prepend(
        document.querySelector("#black-player-score-section")
    );
}