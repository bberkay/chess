import { BoardEditorOperation, NavigatorModalOperation } from "../Types";
import { Chess } from "@Chess/Chess";
import { Color, PieceType, Square, StartPosition } from "@Chess/Types";
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
    private lastCreatedFenNotation: string = StartPosition.Standard;

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
            <input type="text" placeholder="FEN Notation" value = "${StartPosition.Standard}">
            <div class = "border-inset"><button data-menu-operation="${BoardEditorOperation.CreateBoard}" disabled="true">Load</button></div>
          </div>
        `);
    }

    /**
     * This function changes the notation menu to piece editor.
     */
    private changeNotationMenuToPieceEditor(): void
    {
        if(this.isEditorModeEnable()) return;
        document.getElementById("notation-menu")!.id = "piece-creator";
        document.querySelector("#black-player-score-section")?.remove();
        document.querySelector("#white-player-score-section")?.remove();

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
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="King" data-color="White"></div>
                                <span>White King</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="King" data-color="Black"></div>
                                <span>Black King</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Queen" data-color="White"></div>
                                <span>White Queen</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Queen" data-color="Black"></div>
                                <span>Black Queen</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Rook" data-color="White"></div>
                                <span>White Rook</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Rook" data-color="Black"></div>
                                <span>Black Rook</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Bishop" data-color="White"></div>
                                <span>White Bishop</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Bishop" data-color="Black"></div>
                                <span>Black Bishop</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Knight" data-color="White"></div>
                                <span>White Knight</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Knight" data-color="Black"></div>
                                <span>Black Knight</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
                                <div class="piece" data-piece="Pawn" data-color="White"></div>
                                <span>White Pawn</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option" data-menu-operation="${BoardEditorOperation.SelectPiece}">
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

        // Drag events for the piece options.
        (document.querySelectorAll(`
            [data-menu-operation="${BoardEditorOperation.SelectPiece}"]
        `) as NodeListOf<HTMLElement>).forEach((element: HTMLElement) => {
            const piece = element.querySelector(".piece") as HTMLElement;
            if(!piece) return;
            piece.setAttribute("draggable", "true");
            piece.addEventListener("dragstart", () => { this.selectPiece(piece) });
        });
    }

    /**
     * This function makes board creator interactive.
     */
    public enableEditorMode(): void
    {
        if(this.isEditorModeEnable()) return;
        this.chess.board.lock();
        this.changeNotationMenuToPieceEditor();
        (document.querySelectorAll(
            '#board-editor [disabled="true"]'
        ) as NodeListOf<HTMLElement>).forEach((element: HTMLElement) => {
            element.removeAttribute("disabled");
        });
        
        if(this.currentBoardCreatorMode == BoardCreatorMode.Template) 
            this.changeBoardCreatorMode();

        this._isEditorModeEnable = true;
    }

    /**
     * This function makes board creator non-interactive.
     */
    public disableEditorMode(): void
    {
        if(!this.isEditorModeEnable()) return;
        this.chess.board.unlock();
        this.removePieceEditor();
        if(this.currentBoardCreatorMode == BoardCreatorMode.Template) this.changeBoardCreatorMode();
        (document.querySelectorAll('#board-editor [disabled="true"]') as NodeListOf<HTMLElement>).forEach((element: HTMLElement) => {
            element.setAttribute("disabled", "true");
        });
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
     * This function removes the piece editor.
     */
    private removePieceEditor(): void
    {
        document.getElementById("piece-creator")!.innerHTML = "";
        document.getElementById("piece-creator")!.id = "notation-menu";
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
    private _createBoard(fenNotation: string): void
    {
        this.chess.createGame(fenNotation);

        // Create invisible div for triggering the log console to stream 
        // when the game is created.
        const response: HTMLDivElement = document.createElement("div");
        response.id = "board-editor-response";
        response.style.visibility = "hidden";
        document.body.appendChild(response);

        if(this.currentBoardCreatorMode == BoardCreatorMode.Template)
          this.changeBoardCreatorMode();

        const finalFenNotation = this.chess.engine.getGameAsFenNotation();
        this.showFen(finalFenNotation);
        this.lastCreatedFenNotation = finalFenNotation;
    }

    /**
     * This function creates a new board with the board creator.
     */
    public createBoard(fenNotation: string | null = null): void
    {
        this._createBoard(fenNotation || this.getBoardCreatorValue());
    }

    /**
     * Clear the current selected tool effects on the editor
     * and select the new tool.
     */
    private selectEditorTool(selectedTool: HTMLElement): void
    {
        const currentSelectedOption: HTMLElement = document.querySelector(".selected-tool") as HTMLElement;
        if(currentSelectedOption) currentSelectedOption.classList.remove("selected-tool");
        
        selectedTool.classList.add("selected-tool");

        document.querySelector("#chessboard")!.setAttribute("style", "cursor: pointer !important");
        
        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            squareElement.removeAttribute("data-menu-operation");
        });
    }

    /**
     * This function select the piece on the piece creator for creating a new piece.
     */
    public selectPiece(selectedPieceOption: HTMLElement): void
    {
        if(!selectedPieceOption.classList.contains("piece") 
            && !selectedPieceOption.classList.contains("piece-option")
            && !selectedPieceOption.parentElement?.classList.contains(".piece-option")) return;
        this.selectEditorTool(selectedPieceOption.parentElement!);
        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            squareElement.setAttribute("data-menu-operation", BoardEditorOperation.CreatePiece);
            squareElement.addEventListener("dragover", (event: DragEvent) => {
                event.preventDefault();
            });
            squareElement.addEventListener("drop", (event: DragEvent) => {
                event.preventDefault();
                this.createPiece(squareElement);
            });
        });
    }

    /**
     * This function creates the selected piece on the board.
     */
    public createPiece(selectedSquare: HTMLElement): void
    {
        const selectedPieceOption: HTMLElement = document.querySelector(".selected-tool .piece") as HTMLElement;
        if(selectedSquare.classList.contains("square") && selectedPieceOption !== null){
            this.chess.createPiece(
                selectedPieceOption.getAttribute("data-color") as Color,
                selectedPieceOption.getAttribute("data-piece") as PieceType,
                this.chess.board.getSquareID(selectedSquare) as Square
            );
            selectedSquare.setAttribute("data-menu-operation", BoardEditorOperation.RemovePiece);
            this.showFen(this.chess.engine.getGameAsFenNotation());
        }
    }

    /**
     * Remove the piece from the board.
     */
    public removePiece(squareId: HTMLElement): void
    {
        this.chess.removePiece(this.chess.board.getSquareID(squareId) as Square);
        this.showFen(this.chess.engine.getGameAsFenNotation());
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
        this._createBoard(this.lastCreatedFenNotation);
    }

    /**
     * This function clears the board.
     */
    public clearBoard(): void
    {
        this._createBoard(StartPosition.Empty);
    }

    /**
     * This function enables the add piece cursor mode.
     */
    public enableMovePieceCursorMode(): void
    {
        this.selectEditorTool(
            document.querySelector(`
                [data-menu-operation="${BoardEditorOperation.EnableMovePieceCursorMode}"]
            `) as HTMLElement
        );
    }

    /**
     * This function enables the remove piece cursor mode.
     */
    public enableRemovePieceCursorMode(): void
    {
        this.selectEditorTool(
            document.querySelector(`
                [data-menu-operation="${BoardEditorOperation.EnableRemovePieceCursorMode}"]
            `) as HTMLElement
        );

        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            squareElement.setAttribute("data-menu-operation", BoardEditorOperation.RemovePiece);
        });

        document.querySelector("#chessboard")!.setAttribute("style", "cursor: no-drop !important");
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
        return formValue!;
    }

    /**
     * This function shows the FEN notation on the form.
     */
    public showFen(fenNotation: string): void
    {
        (document.querySelector(`.${BoardCreatorMode.Custom} input`) as HTMLInputElement).value = fenNotation;
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
