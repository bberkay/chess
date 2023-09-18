import {Color, PieceType} from "../../Chess/Types";

/**
 * This class provide a table to show the notation.
 */
export class NotationMenu {

    private lastNotation: string;
    private lastScore: Record<Color, number>;

    /**
     * Constructor of the LogConsole class.
     */
    constructor() {
        this.lastNotation = "";
        this.lastScore = {[Color.White]: 0, [Color.Black]: 0};

        // Load css file of the chess board.
        this._loadCSS();

        // Create the table.
        this.createTable();
    }

    /**
     * This function loads the css file of the notation table.
     */
    private _loadCSS(): void
    {
        // Check if the css file is already loaded.
        if(document.getElementById("notation-table-css"))
            return;

        // Create the link element and set the attributes.
        let link: HTMLLinkElement = document.createElement("link");
        link.id = "notation-menu-css";
        link.rel = "stylesheet";
        link.href = "./src/Platform/Components/Assets/css/notation-menu.css";

        // Add the link element to the head of the document.
        document.head.appendChild(link);
    }

    /**
     * This function creates the table.
     */
    private createTable(){
        document.getElementById("notation-menu")!.innerHTML =
            `
                <div class = "score-table" id = "black-player-pieces"></div>
                <div id = "notation-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Move</th>
                                <th>White</th>
                                <th>Black</th>
                            </tr>
                        </thead>
                        <tbody id = "notations"></tbody>
                    </table>
                </div>
                <div class = "score-table" id = "white-player-pieces"></div>
            `;
    }

    /**
     * This function clears the table.
     */
    public clear(): void
    {
        this.createTable();
        this.lastNotation = "";
        this.lastScore = {[Color.White]: 0, [Color.Black]: 0};
    }

    /**
     * This function sets the table by given notation.
     */
    public addNotations(notation: Array<string>): void
    {
        this.clear();

        for(let i = 0; i < notation.length; i++){
            this.addNotation(notation.slice(0, i + 1));
        }
    }

    /**
     * This function adds a row/notation to the table.
     */
    public addNotation(notation: Array<string>): void
    {
        // Check if the notation is already added.
        if(this.lastNotation == notation[notation.length - 1] || notation.length < 1)
            return;

        // Find the color of the notation.
        let color: string = notation.length % 2 == 0 ? Color.Black : Color.White;

        /**
         * If notation is white then create new notation row/tr and add as td,
         * otherwise add the notation to the last row as td.
         */
        const notations: HTMLElement = document.getElementById("notations")!;

        if(color == Color.White){
            notations.innerHTML +=
                `
                    <tr>
                        <td>${notation.length / 2 + 0.5}</td>
                        <td>${notation[notation.length - 1]}</td>
                        <td></td>
                    </tr>
                `;
        }else{
            notations.lastElementChild!.lastElementChild!.innerHTML = notation[notation.length - 1];
        }

        // Scroll to the bottom of the table.
        const notationTable: HTMLElement = document.getElementById("notation-table")!;
        notationTable.scrollTop = notationTable.scrollHeight;

        // Set the last notation.
        this.lastNotation = notation[notation.length - 1];
    }

    /**
     * This function shows the score of the players top and bottom of the table.
     */
    public showScore(scores: Record<Color, {score: number, pieces: PieceType[]}>): void
    {
        if(this.lastScore.White == scores.White.score && this.lastScore.Black == scores.Black.score)
            return;

        // Clear the score table.
        document.getElementById("white-player-pieces")!.innerHTML = "";
        document.getElementById("black-player-pieces")!.innerHTML = "";

        // Unicode of the pieces.
        const pieceUnicode: {[key in PieceType]?: string} = {
            [PieceType.Pawn]: "&#9817;",
            [PieceType.Rook]: "&#9814;",
            [PieceType.Knight]: "&#9816;",
            [PieceType.Bishop]: "&#9815;",
            [PieceType.Queen]: "&#9813;",
        }

        // Show the pieces of the players on the top and bottom of the table.
        scores[Color.White].pieces.forEach((piece: PieceType) => {
            document.getElementById("white-player-pieces")!.innerHTML += " " + pieceUnicode[piece];
        });
        scores[Color.Black].pieces.forEach((piece: PieceType) => {
            document.getElementById("black-player-pieces")!.innerHTML += " " + pieceUnicode[piece];
        });

        // Show the score of the players on the top and bottom of the table.
        const whiteScore = scores[Color.White].score;
        const blackScore = scores[Color.Black].score;
        document.getElementById("white-player-pieces")!.innerHTML += whiteScore <= 0 ? "" : " +" + whiteScore;
        document.getElementById("black-player-pieces")!.innerHTML += blackScore <= 0 ? "" : " +" + blackScore;

        // Set the last score.
        this.lastScore = {[Color.White]: whiteScore, [Color.Black]: blackScore};
    }
}
