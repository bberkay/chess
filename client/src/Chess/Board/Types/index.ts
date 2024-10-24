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
    PreKilled = "prekilled",
    Playable = "playable",
    PrePlayable = "preplayable",
    PrePlayed = "preplayed",
    Winner = "winner",
    WinnerAnimation = "winner-animation",
}

/**
 * @description SquareClickMode enum for the click modes of the chess board.
 * @see src/Chess/Board/ChessBoard.ts For more information.
 */
export enum SquareClickMode{
    PreSelect = "PreSelect",
    Select = "Select",
    PreSelected = "PreSelected",
    Selected = "Selected",
    PrePlay = "PrePlay",
    Play = "Play",
    PrePromote = "PrePromote", // Promote the pawn to queen.
    Promote = "Promote", // Promote the pawn to the selected piece.
    PrePromotion = "PrePromotion", 
    Promotion = "Promotion", // Move pawn to the promotion square.
    PreCastling = "PreCastling",
    Castling = "Castling",
    PreEnPassant = "PreEnPassant",
    EnPassant = "EnPassant",
    Disable = "Disable",
    Clear = "Clear",
}

/**
 * @description SoundEffect enum for the sound effects of the chess board.
 * @see src/Chess/Board/ChessBoard.ts For more information.
 */
export enum SoundEffect{
    Start = "Start",
    Move = "Move",
    Capture = "Capture",
    Castle = "Castle",
    Check = "Check",
    Promote = "Promote",
    LowTime = "LowTime",
    End = "End",
}