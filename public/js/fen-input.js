// Find Fen Components
const customFenBtn = document.getElementById("use-custom-fen-btn");
const templateFenBtn = document.getElementById("use-template-fen-btn");
const customFen = document.getElementById("fen-custom");
const templateFen = document.getElementById("fen-template");

// Open Custom FEN Input
customFenBtn.addEventListener("click", () => {
    customFen.style.display = "flex";
    templateFen.style.display = "none";
});

// Open Template FEN Input
templateFenBtn.addEventListener("click", () => {
    templateFen.style.display = "flex";
    customFen.style.display = "none";
});

// Add Templates To Select
const loadCustomFen = document.getElementById("template-fen-select");