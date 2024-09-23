import { PlatformEvent, BoardEditorOperation, NavigatorModalOperation } from "../Types";
import { Chess } from "@Chess/Chess";
import { Color, GameStatus, JsonNotation, PieceType, Square, StartPosition } from "@Chess/Types";
import { Component } from "./Component";

enum BoardCreatorMode {
    Custom = "custom-board-creator-mode",
    Template = "template-board-creator-mode"
}

/**
 * Decorator to check if the editor mode is enabled or not
 * before executing the function that requires the editor mode to be enabled.
 */
function isEditorModeEnable() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;
  
      descriptor.value = function (...args: any[]) {
        if (!BoardEditor.isEditorModeEnable()) {
          throw new Error("The editor mode is not enabled.");
        }
        return originalMethod.apply(this, args);
      };
    };
}

/**
 * This class provide a form to create a new board.
 */
export class BoardEditor extends Component{
    private readonly chess: Chess;

    private static _isEditorModeEnable: boolean = false;
    private _boardEditorObserver: MutationObserver | null = null;
    private _currentBoardCreatorMode: BoardCreatorMode = BoardCreatorMode.Custom
    private _lastLoadedFenNotation: string = StartPosition.Standard;

    /**
     * Constructor of the BoardCreator class.
     */
    constructor(chess: Chess) {
        super();
        this.chess = chess;
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
        if(!BoardEditor.isEditorModeEnable()) return;
        document.getElementById("notation-menu")!.style.display = "none";
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
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="King" data-color="Black"></div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Queen" data-color="White"></div>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Queen" data-color="Black"></div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Rook" data-color="White"></div>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Rook" data-color="Black"></div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Bishop" data-color="White"></div>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Bishop" data-color="Black"></div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Knight" data-color="White"></div>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Knight" data-color="Black"></div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Pawn" data-color="White"></div>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Pawn" data-color="Black"></div>
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
                    <button class="menu-item" data-menu-operation="${NavigatorModalOperation.ShowStartPlayingBoard}" data-tooltip-text="Start the Board" disabled="true">Start</button>
                    <button class="menu-item" data-menu-operation="${NavigatorModalOperation.ShowGameCreator}" data-tooltip-text="Create New Game">+ New Game</button>
                </div>
            </div>
        `);
    }

    /**
     * Enable the start game button.
     */
    @isEditorModeEnable()
    private enableStartGameButton(): void
    {
        const startButton: HTMLElement = document.querySelector(`[data-menu-operation="${NavigatorModalOperation.ShowStartPlayingBoard}"]`) as HTMLElement;
        startButton.removeAttribute("disabled");
    }

    /**
     * Disable the start game button.
     */
    @isEditorModeEnable()
    private disableStartGameButton(): void
    {
        const startButton: HTMLElement = document.querySelector(`[data-menu-operation="${NavigatorModalOperation.ShowStartPlayingBoard}"]`) as HTMLElement;
        startButton.setAttribute("disabled", "true");
    }

    /**
     * This function removes the piece editor.
     */
    @isEditorModeEnable()
    private removePieceEditor(): void
    {
        document.getElementById("piece-creator")!.innerHTML = "";
        document.getElementById("notation-menu")!.style.display = "flex";
    }

    /**
     * This function enables the editor mode.
     */
    public enableEditorMode(): void
    {
        if(BoardEditor.isEditorModeEnable()) return;
        BoardEditor._isEditorModeEnable = true;

        if(this._currentBoardCreatorMode == BoardCreatorMode.Template) 
            this.changeBoardCreatorMode();
        
        this.createPieceEditor();
        this.enableBoardCreator();
        this.createBoard();
        this.enableBoardObserver();
    }

    /**
     * This function disables the editor mode.
     */
    @isEditorModeEnable()
    public disableEditorMode(): void
    {
        if(this._currentBoardCreatorMode == BoardCreatorMode.Template) 
            this.changeBoardCreatorMode();
        
        this.disableBoardCreator();
        this.disableCursorMode();
        this.removePieceEditor();
        this.disableBoardObserver();
        BoardEditor._isEditorModeEnable = false;

        this.createBoard();
    }

    /**
     * Check if the board creator is enabled or not.
     */
    public static isEditorModeEnable(): boolean
    {
        return BoardEditor._isEditorModeEnable;
    }

    /**
     * This function initiates the board observer for dispatching the event 
     * when there is a change in the board that made by the editor.
     */
    @isEditorModeEnable()
    private enableBoardObserver(): void
    {
        this._boardEditorObserver = new MutationObserver((mutations: MutationRecord[]) => {
            mutations.forEach((mutation: MutationRecord) => {
                if((mutation.target as HTMLElement).hasAttribute("data-menu-operation")){
                    document.dispatchEvent(new CustomEvent(
                        PlatformEvent.OnOperationMounted, 
                        { detail: { selector: mutation.target } }
                    ));
                }
            });
        });

        this._boardEditorObserver.observe(
            document.getElementById("chessboard")!,
            { 
                childList: true, 
                subtree: true, 
                attributes: true,
                attributeFilter: ["data-menu-operation"],
                characterData: false,
            }
        );
    }

    /**
     * This function disables the board observer.
     */
    private disableBoardObserver(): void
    {
        if(this._boardEditorObserver) this._boardEditorObserver.disconnect();
    }

    /**
     * This function adds drag and drop event listeners to the pieces and squares
     * for editing the board.
     */
    @isEditorModeEnable()
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
            squareElement.addEventListener("dragover", (e: DragEvent) => { e.preventDefault() });
            squareElement.addEventListener("drop", (e: DragEvent) => {
                e.preventDefault();
                this.createPiece(squareElement);
                const selectedPieceOption: HTMLElement = document.querySelector(".selected-option") as HTMLElement;
                if(selectedPieceOption.closest("#chessboard")) this.removePiece(selectedPieceOption);
            });
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
        this._currentBoardCreatorMode = this._currentBoardCreatorMode === BoardCreatorMode.Template 
            ? BoardCreatorMode.Custom 
            : BoardCreatorMode.Template;
        document.querySelector(`.board-creator.${this._currentBoardCreatorMode}`)!.classList.add("visible");
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
        if(BoardEditor.isEditorModeEnable()){
            this.chess.board.lock();
            this.chess.board.removeEffectFromAllSquares();
            this.addDragAndDropEventListeners();
            this.enableMovePieceCursorMode();
        }
        
        if(this._currentBoardCreatorMode == BoardCreatorMode.Template)
          this.changeBoardCreatorMode();

        document.dispatchEvent(new Event(PlatformEvent.OnBoardCreated));
    }

    /**
     * This function creates a new board with the board creator.
     */
    public createBoard(fenNotation: string | StartPosition | JsonNotation | null = null): void
    {
        this._createBoard(fenNotation || this.getFen());
    }

    /**
     * Clear the current selected option effects on the editor
     * and select the new tool.
     */
    @isEditorModeEnable()
    private selectOption(selectedOption: HTMLElement): void
    {
        const currentSelectedOption: HTMLElement = document.querySelector(".selected-option") as HTMLElement;
        if(currentSelectedOption) currentSelectedOption.classList.remove("selected-option");
        
        selectedOption.classList.add("selected-option");

        (document.querySelectorAll("#chessboard, #chessboard .piece, #chessboard .square") as NodeListOf<HTMLElement>)
            .forEach((piece: HTMLElement) => { piece.setAttribute("style", "cursor: pointer !important") });
    }

    /**
     * This function select the piece on the piece creator for creating a new piece.
     */
    @isEditorModeEnable()
    private makePieceSelectable(piece: HTMLElement): void
    {
        if(piece.classList.contains("piece")){
            piece.setAttribute("draggable", "true");
            piece.parentElement!.addEventListener("dragstart", () => { 
                if(piece.parentElement) this.selectOption(piece.parentElement!);
            });
            piece.parentElement!.addEventListener("dragend", () => {
                if(piece.parentElement && piece.parentElement.classList.contains("square"))
                    this.removePiece(piece.parentElement);
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
    @isEditorModeEnable()
    public createPiece(selectedSquare: HTMLElement): void
    {
        const selectedPieceOption: HTMLElement = document.querySelector(".selected-option .piece") as HTMLElement;
        if(selectedSquare.classList.contains("square") && selectedPieceOption !== null){
            this.chess.createPiece(
                selectedPieceOption.getAttribute("data-color") as Color,
                selectedPieceOption.getAttribute("data-piece") as PieceType,
                this.chess.board.getSquareId(selectedSquare) as Square
            );
            this.makePieceSelectable(selectedSquare.querySelector(".piece") as HTMLElement);
        }
    }

    /**
     * Remove the piece from the board.
     */
    @isEditorModeEnable()
    public removePiece(squareElement: HTMLElement): void
    {
        this.chess.removePiece(this.chess.board.getSquareId(squareElement) as Square);
        squareElement.setAttribute("data-menu-operation", BoardEditorOperation.CreatePiece);
    }

    /**
     * This function enables the add piece cursor mode.
     */
    @isEditorModeEnable()
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
    @isEditorModeEnable()
    public enableRemovePieceCursorMode(): void
    {
        this.selectOption(
            document.querySelector(`
                [data-menu-operation="${BoardEditorOperation.EnableRemovePieceCursorMode}"]
            `) as HTMLElement
        );
        
        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            if(this.chess.board.getPieceElementOnSquare(squareElement)){
                squareElement.setAttribute("data-menu-operation", BoardEditorOperation.RemovePiece);
            }
        });

        (document.querySelectorAll("#chessboard, #chessboard .piece, #chessboard .square") as NodeListOf<HTMLElement>)
            .forEach((piece: HTMLElement) => { piece.setAttribute("style", "cursor: no-drop !important") });
    }
    
    /**
     * This function disables the cursor mode.
     */
    @isEditorModeEnable()
    private disableCursorMode(): void
    {
        this.chess.board.getAllSquares().forEach((squareElement: HTMLElement) => {
            squareElement.removeAttribute("data-menu-operation");
        });

        (document.querySelectorAll("#chessboard, #chessboard .piece, #chessboard .square") as NodeListOf<HTMLElement>)
            .forEach((piece: HTMLElement) => { piece.removeAttribute("style") });
    }

    /**
     * This function clears the board.
     */
    @isEditorModeEnable()
    public clearBoard(): void
    {
        this._createBoard(StartPosition.Empty);
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
        this._createBoard(this._lastLoadedFenNotation);
    }

    /**
     * This function if the current mode is custom mode or not.
     */
    public isBoardCreatorModeCustom(): boolean
    {
        return this._currentBoardCreatorMode == BoardCreatorMode.Custom;
    }

    /**
     * Get the form value of the custom or template mode.
     */
    public getFen(): string
    {
        let formValue: string;
        
        if(this._currentBoardCreatorMode == BoardCreatorMode.Custom)
            formValue = (document.querySelector(`.${BoardCreatorMode.Custom} input`) as HTMLInputElement).value;
        else if(this._currentBoardCreatorMode == BoardCreatorMode.Template)
            formValue = (document.querySelector(`.${BoardCreatorMode.Template} select`) as HTMLSelectElement).value;

        this._lastLoadedFenNotation = formValue!;
        return formValue!;
    }

    /**
     * This function shows the FEN notation on the form.
     */
    public updateFen(): void
    {
        if(!this.isBoardCreatorModeCustom()) this.changeBoardCreatorMode();
        const inputElement = document.querySelector(`.${BoardCreatorMode.Custom} input`) as HTMLInputElement;
        inputElement.value = this.chess.engine.getGameAsFenNotation();
        
        if(BoardEditor.isEditorModeEnable()){
            if(this.chess.engine.getGameStatus() == GameStatus.ReadyToStart) 
                this.enableStartGameButton();
            else 
                this.disableStartGameButton();
        }
    }

    /**
     * This function clears the form.
     */
    public clearFen(): void
    {
        (document.querySelector(`.${BoardCreatorMode.Custom} input`) as HTMLInputElement).value = "";
        (document.querySelector(`.${BoardCreatorMode.Template} select`) as HTMLSelectElement).selectedIndex = 0;
    }
}
