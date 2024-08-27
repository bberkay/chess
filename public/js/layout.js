document.addEventListener("DOMContentLoaded", function() {
    createTooltips();
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

function createTooltips(){
    const tooltips = document.querySelectorAll("[data-tooltip-text]");
    tooltips.forEach(tooltipParent => {
        const tooltipText = tooltipParent.getAttribute("data-tooltip-text");
        const tooltipElement = document.createElement("div");
        tooltipElement.classList.add("tooltip");
        tooltipParent.append(tooltipElement);

        let tooltipTimeout;
        tooltipParent.addEventListener("mouseover", function() {
            tooltipTimeout = setTimeout(() => {
                tooltipElement.classList.add("active");
                tooltipElement.textContent = tooltipText;
            }, 500);
        });

        tooltipParent.addEventListener("mouseout", function() {
            clearTimeout(tooltipTimeout);
            tooltipElement.classList.remove("active");
            tooltipElement.textContent = "";
        });
    });
}

function reOrderLayoutForMobile(){
    if(document.querySelector("#notation-menu") == null)
        return;

    document.querySelector(".right").append(
        document.querySelector("#game-creator")
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
        document.querySelector("#game-creator")
    );

    document.querySelector("#notation-menu").append(
        document.querySelector("#white-player-score-section")
    );

    document.querySelector("#notation-menu").prepend(
        document.querySelector("#black-player-score-section")
    );
}