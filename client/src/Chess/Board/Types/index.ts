/**
 * @description SquareEffect enum for the effects of the move/square.
 * @see src/Chess/Board/ChessBoard.ts For more information.
 */
export enum SquareEffect{
    Selected = "selected",
    PreSelected = "preselected",
    Disabled = "disabled",
    Hovering = "hovering",
    From = "from",
    To = "to",
    Checked = "checked",
    Killable = "killable",
    PreKillable = "prekillable",
    Playable = "playable",
    PrePlayable = "preplayable",
}

/**
 * @description SquareClickMode enum for the click modes of the chess board.
 * @see src/Chess/Board/ChessBoard.ts For more information.
 */
export enum SquareClickMode{
    Select = "Select",
    PreSelect = "PreSelect",
    Selected = "Selected",
    PreSelected = "PreSelected",
    Play = "Play",
    Clear = "Clear",
    Promote = "Promote", // Promote the pawn to the selected piece.
    Promotion = "Promotion", // Move pawn to the promotion square.
    Disable = "Disable",
    Castling = "Castling",
    EnPassant = "EnPassant"
}

/**
 * @description SoundEffect enum for the sound effects of the chess board.
 * @see src/Chess/Board/ChessBoard.ts For more information.
 */
export enum SoundEffect{
    Start = "Start",
    WhiteMove = "WhiteMove",
    BlackMove = "BlackMove",
    Capture = "Capture",
    Castle = "Castle",
    Check = "Check",
    Promote = "Promote",
    End = "End",
}