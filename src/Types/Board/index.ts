/**
 * @description SquareEffect enum for the effects of the move/square.
 * @type {string}
 * @see src/UI/ChessBoard.ts For more information.
 */
export enum SquareEffect{
    Checked = "checked",
    Killable = "killable",
    Playable = "playable",
    Selected = "selected",
    Disabled = "disabled",
}

/**
 * @description SquareClickMode enum for the click modes of the chess board.
 * @type {string}
 * @see src/UI/ChessBoard.ts For more information.
 */
export enum SquareClickMode{
    Select = "Select",
    Play = "Play",
    Clear = "Clear",
    Promote = "Promote",
    Disable = "Disable"
}