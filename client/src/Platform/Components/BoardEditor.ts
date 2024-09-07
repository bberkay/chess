import { BoardEditorOperation, NavigatorModalOperation } from "../Types";
import { Chess } from "@Chess/Chess";
import { Color, JsonNotation, PieceType, Square, StartPosition } from "@Chess/Types";
import { Component } from "./Component";

enum BoardCreatorMode {
    Custom = "custom-board-creator-mode",
    Template = "template-board-creator-mode"
}

/**
 * This class provide a form to create a new board.
 */
export class BoardEditor extends Component{
    private readonly chess: Chess;
    private _isEditorModeEnable: boolean = false;
    private currentBoardCreatorMode: BoardCreatorMode;
    private lastLoadedFenNotation: string = StartPosition.Standard;

    /**
     * Constructor of the BoardCreator class.
     */
    constructor(chess: Chess){
        super();
        this.chess = chess;
        this.currentBoardCreatorMode = BoardCreatorMode.Custom;
        this.loadCSS("board-editor.css");
        this.renderComponent();
    }

    /**
     * This function renders the game creator.
     */
    protected renderComponent(): void
    {
        this.loadHTML("board-editor", `
          <div class = "board-creator ${BoardCreatorMode.Template}">
              <div class = "border-inset"><button data-menu-operation="${BoardEditorOperation.ChangeBoardCreatorMode}" disabled="true">Custom</button></div>
              <select disabled="true">${this.getTemplateOptions()}</select>
              <div class = "border-inset"><button data-menu-operation="${BoardEditorOperation.CreateBoard}" disabled="true">Load</button></div>
          </div>
          <div class = "board-creator ${BoardCreatorMode.Custom} visible">
            <div class = "border-inset"><button data-menu-operation="${BoardEditorOperation.ChangeBoardCreatorMode}" disabled="true">Templates</button></div>
            <input type="text" id="fen-notation" placeholder="FEN Notation" value = "${StartPosition.Standard}">
            <div class = "border-inset"><button data-menu-operation="${BoardEditorOperation.CreateBoard}" disabled="true">Load</button></div>
          </div>
        `);
    }

    /**
     * This function changes the notation menu to piece editor.
     */
    public createPieceEditor(): void
    {
        if(this.isEditorModeEnable()) return;
        document.getElementById("notation-menu")!.id = "piece-creator";
        document.querySelector("#black-score-section")?.remove();
        document.querySelector("#white-score-section")?.remove();

        this.loadHTML("piece-creator", `
            <table id = "piece-table">
                <thead>
                    <tr>
                        <th>White</th>
                        <th>Black</th>
                    </tr>
                </thead>
                <tbody id = "piece-options">
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="King" data-color="White"></div>
                                <span>White King</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="King" data-color="Black"></div>
                                <span>Black King</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Queen" data-color="White"></div>
                                <span>White Queen</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Queen" data-color="Black"></div>
                                <span>Black Queen</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Rook" data-color="White"></div>
                                <span>White Rook</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Rook" data-color="Black"></div>
                                <span>Black Rook</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Bishop" data-color="White"></div>
                                <span>White Bishop</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Bishop" data-color="Black"></div>
                                <span>Black Bishop</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Knight" data-color="White"></div>
                                <span>White Knight</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Knight" data-color="Black"></div>
                                <span>Black Knight</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Pawn" data-color="White"></div>
                                <span>White Pawn</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Pawn" data-color="Black"></div>
                                <span>Black Pawn</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="utility-menu">
                <button class="menu-item" data-menu-operation="${BoardEditorOperation.FlipBoard}" data-tooltip-text="Flip Board">F</button>
                <button class="menu-item" data-menu-operation="${BoardEditorOperation.EnableMovePieceCursorMode}" data-tooltip-text="Move Piece">+</button>
                <button class="menu-item" data-menu-operation="${BoardEditorOperation.EnableRemovePieceCursorMode}" data-tooltip-text="Remove Piece">-</button>
                <button class="menu-item" data-menu-operation="${BoardEditorOperation.ClearBoard}" data-tooltip-text="Clear Board">X</button>
                <button class="menu-item" data-menu-operation="${BoardEditorOperation.ResetBoard}" data-tooltip-text="Reset Board">R</button>
                <button class="menu-item" data-menu-operation="${BoardEditorOperation.ToggleBoardEditorUtilityMenu}">☰</button>
            </div>
            <div class="utility-menu utility-toggle-menu visible">
                <div class="utility-toggle-menu-section active">
                    <button class="menu-item" data-menu-operation="" data-tooltip-text="Start the Board" disabled="true">Start</button>
                    <button class="menu-item" data-menu-operation="${NavigatorModalOperation.ShowGameCreator}" data-tooltip-text="Create New Game">+ New Game</button>
                    <button class="menu-item" data-menu-operation="${NavigatorModalOperation.ShowWelcome}" data-tooltip-text="About Project">Info</button>
                </div>
            </div>
        `);
    }

    /**
     * This function removes the piece editor.
     */
    private removePieceEditor(): void
    {
        document.getElementById("piece-creator")!.innerHTML = "";
        document.getElementById("piece-creator")!.id = "notation-menu";
    }

    /**
     * This function makes board creator interactive.
     */
    public enableEditorMode(): void
    {
        if(this.isEditorModeEnable()) return;
        this.chess.board.lock();
        this.chess.board.removeEffectFromAllSquares();
        this.createPieceEditor();
        this.addDragAndDropEventListeners();
        this.enableMovePieceCursorMode();
        this.enableBoardCreator();
        if(this.currentBoardCreatorMode == BoardCreatorMode.Template) this.changeBoardCreatorMode();
        this._isEditorModeEnable = true;
    }

    /**
     * This function makes board creator non-interactive.
     */
    public disableEditorMode(): void
    {
        if(!this.isEditorModeEnable()) return;
        this.chess.board.unlock();
        this.removeDragAndDropEventListeners();
        this.disableBoardCreator();
        this.removePieceEditor();
        if(this.currentBoardCreatorMode == BoardCreatorMode.Template) this.changeBoardCreatorMode();
        this._isEditorModeEnable = false;
    }

    /**
     * Check if the board creator is enabled or not.
     */
    public isEditorModeEnable(): boolean
    {
        return this._isEditorModeEnable;
    }

    /**
     * This function adds drag and drop event listeners to the pieces and squares
     * for editing the board.
     */
    private addDragAndDropEventListeners(): void
    {
        // Drag event listeners for the pieces.
        (document.querySelectorAll(`
            #chessboard .piece, #piece-creator .piece
        `) as NodeListOf<HTMLElement>)
            .forEach((piece: HTMLElement) => {
                this.makePieceSelectable(piece);
            });

        // Drop event listeners for the squares.
        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            // For creating the piece on the board by clicking on the square.
            squareElement.setAttribute("data-menu-operation", BoardEditorOperation.CreatePiece);

            // For creating the piece on the board by dropping the piece on the square.
            squareElement.addEventListener("dragover", (event: DragEvent) => { event.preventDefault() });
            squareElement.addEventListener("drop", (event: DragEvent) => {
                console.log("Dropping piece: ", squareElement);
                event.preventDefault();
                this.createPiece(squareElement);
                const selectedPieceOption: HTMLElement = document.querySelector(".selected-option") as HTMLElement;
                if(selectedPieceOption.closest("#chessboard")) this.removePiece(selectedPieceOption);
            });
        });
    }

    /**
     * This function removes the drag and drop event listeners from the pieces and squares.
     */
    private removeDragAndDropEventListeners(): void
    {
        (document.querySelectorAll(`.piece`) as NodeListOf<HTMLElement>).forEach((piece: HTMLElement) => {
            piece.removeAttribute("draggable");
        });
        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            squareElement.removeAttribute("data-menu-operation");
        });
    }

    /**
     * This function enables the board creator.
     */
    private enableBoardCreator(): void
    {
        (document.querySelectorAll(".board-creator button, .board-creator select") as NodeListOf<HTMLElement>)
            .forEach((element: HTMLElement) => {
                element.removeAttribute("disabled");
            });
    }
    
    /**
     * This function disables the board creator.
     */
    private disableBoardCreator(): void
    {
        (document.querySelectorAll(".board-creator button, .board-creator select") as NodeListOf<HTMLElement>)
            .forEach((element: HTMLElement) => {
                element.setAttribute("disabled", "true");
            });
    }

    /**
     * This function toggles the utility menu.
     */
    public toggleUtilityMenu(): void
    {
        document.querySelector(`#piece-creator .utility-toggle-menu`)!.classList.toggle("visible");
    }

    /**
     * This function changes the mode of the form.
     */
    public changeBoardCreatorMode(): void
    {
        const boardCreator: HTMLElement = document.querySelector('.board-creator.visible') as HTMLElement;
        boardCreator.classList.remove("visible");
        this.currentBoardCreatorMode = this.currentBoardCreatorMode === BoardCreatorMode.Template ? BoardCreatorMode.Custom : BoardCreatorMode.Template;
        document.querySelector(`.board-creator.${this.currentBoardCreatorMode}`)!.classList.add("visible");
    }

    /**
     * Get the template mode of the form.
     */
    private getTemplateOptions(): string
    {
        let options: string = "";
        for (const position in StartPosition) {
          // @ts-ignore
          options += `<option value="${StartPosition[position as string]}">${position}</option>`;
        }
        return options;
    }

    /**
     * This function creates a new board with the board creator.
     */
    private _createBoard(notation: string | JsonNotation): void
    {
        this.chess.createGame(notation);
        if(this.isEditorModeEnable()){
            this.chess.board.lock();
            this.chess.board.removeEffectFromAllSquares();
            this.addDragAndDropEventListeners();
            this.enableMovePieceCursorMode();
        }

        // Create invisible div for triggering the log console to stream 
        // when the game is created.
        const response: HTMLDivElement = document.createElement("div");
        response.id = "board-editor-response";
        response.style.visibility = "hidden";
        document.body.appendChild(response);

        if(this.currentBoardCreatorMode == BoardCreatorMode.Template)
          this.changeBoardCreatorMode();

        this.showFen(this.chess.engine.getGameAsFenNotation());
    }

    /**
     * This function creates a new board with the board creator.
     */
    public createBoard(fenNotation: string | null = null): void
    {
        this._createBoard(fenNotation || this.getBoardCreatorValue());
    }

    /**
     * Clear the current selected option effects on the editor
     * and select the new tool.
     */
    private selectOption(selectedOption: HTMLElement): void
    {
        const currentSelectedOption: HTMLElement = document.querySelector(".selected-option") as HTMLElement;
        if(currentSelectedOption) currentSelectedOption.classList.remove("selected-option");
        
        selectedOption.classList.add("selected-option");

        document.querySelector("#chessboard")!.setAttribute("style", "cursor: pointer !important");
    }

    /**
     * This function select the piece on the piece creator for creating a new piece.
     */
    public makePieceSelectable(piece: HTMLElement): void
    {
        if(piece.classList.contains("piece")){
            piece.setAttribute("draggable", "true");
            piece.parentElement!.addEventListener("dragstart", () => { 
                this.selectOption(piece.parentElement!);
            });
            if(!piece.closest("#chessboard")){
                piece.parentElement!.addEventListener("click", () => {
                    this.selectOption(piece.parentElement!);
                });
            }
        }
    }

    /**
     * This function creates the selected piece on the board.
     */
    public createPiece(selectedSquare: HTMLElement): void
    {
        const selectedPieceOption: HTMLElement = document.querySelector(".selected-option .piece") as HTMLElement;
        if(selectedSquare.classList.contains("square") && selectedPieceOption !== null){
            this.chess.createPiece(
                selectedPieceOption.getAttribute("data-color") as Color,
                selectedPieceOption.getAttribute("data-piece") as PieceType,
                this.chess.board.getSquareID(selectedSquare) as Square
            );
            this.makePieceSelectable(selectedSquare.querySelector(".piece") as HTMLElement);
            this.showFen(this.chess.engine.getGameAsFenNotation());
        }
    }

    /**
     * Remove the piece from the board.
     */
    public removePiece(squareElement: HTMLElement): void
    {
        this.chess.removePiece(this.chess.board.getSquareID(squareElement) as Square);
        squareElement.setAttribute("data-menu-operation", BoardEditorOperation.CreatePiece);
        this.showFen(this.chess.engine.getGameAsFenNotation());
    }

    /**
     * This function enables the add piece cursor mode.
     */
    public enableMovePieceCursorMode(): void
    {
        this.selectOption(
            document.querySelector(`
                [data-menu-operation="${BoardEditorOperation.EnableMovePieceCursorMode}"]
            `) as HTMLElement
        );

        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            if(this.chess.board.getPieceElementOnSquare(squareElement))
                squareElement.removeAttribute("data-menu-operation");
        });
    }

    /**
     * This function enables the remove piece cursor mode.
     */
    public enableRemovePieceCursorMode(): void
    {
        this.selectOption(
            document.querySelector(`
                [data-menu-operation="${BoardEditorOperation.EnableRemovePieceCursorMode}"]
            `) as HTMLElement
        );

        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            if(this.chess.board.getPieceElementOnSquare(squareElement))
                squareElement.setAttribute("data-menu-operation", BoardEditorOperation.RemovePiece);
        });

        document.querySelector("#chessboard")!.setAttribute("style", "cursor: no-drop !important");
    }
    
    /**
     * This function flips the board.
     */
    public flipBoard(): void
    {
        this.chess.board.flip();
    }

    /**
     * This function if the current mode is custom mode or not.
     */
    public resetBoard(): void
    {
        this._createBoard(this.lastLoadedFenNotation);
    }

    /**
     * This function clears the board.
     */
    public clearBoard(): void
    {
        this._createBoard(StartPosition.Empty);
    }

    /**
     * This function if the current mode is custom mode or not.
     */
    public isBoardCreatorModeCustom(): boolean
    {
        return this.currentBoardCreatorMode == BoardCreatorMode.Custom;
    }

    /**
     * Get the form value of the custom or template mode.
     */
    private getBoardCreatorValue(): string
    {
        let formValue: string;
        
        if(this.currentBoardCreatorMode == BoardCreatorMode.Custom)
            formValue = (document.querySelector(`.${BoardCreatorMode.Custom} input`) as HTMLInputElement).value;
        else if(this.currentBoardCreatorMode == BoardCreatorMode.Template)
            formValue = (document.querySelector(`.${BoardCreatorMode.Template} select`) as HTMLSelectElement).value;

        this.lastLoadedFenNotation = formValue!;
        return formValue!;
    }

    /**
     * This function shows the FEN notation on the form.
     */
    public showFen(fenNotation: string): void
    {
        const inputElement = document.querySelector(`.${BoardCreatorMode.Custom} input`) as HTMLInputElement;
        inputElement.value = fenNotation;
        inputElement.dispatchEvent(new Event("change"));
    }

    /**
     * This function clears the form.
     */
    public clearBoardCreator(): void
    {
        (document.querySelector(`.${BoardCreatorMode.Custom} input`) as HTMLInputElement).value = "";
        (document.querySelector(`.${BoardCreatorMode.Template} select`) as HTMLSelectElement).selectedIndex = 0;
    }
}
