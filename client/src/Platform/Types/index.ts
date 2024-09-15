/**
 * BoardEditorEvent enum for board editor related events.
 * @enum {string}
 */
export enum BoardEditorEvent {
    /**
     * Triggered when a board is created by the board editor.
     * @event
     */
    onBoardCreatedByBoardEditor = "onBoardCreatedByBoardEditor"
}

export enum NotationMenuOperation{
    SendDrawOffer = "SendDrawOffer",
    SendUndoOffer = "SendUndoOffer",
    Resign = "Resign",
    PreviousMove = "PreviousMove",
    NextMove = "NextMove",
    LastMove = "LastMove",
    FirstMove = "FirstMove",
    ToggleNotationMenuUtilityMenu = "ToggleNotationMenuUtilityMenu",
}

export enum NavigatorModalOperation{
    Hide = "Hide",
    Undo = "Undo",
    ShowGameCreator = "ShowGameCreator",
    ShowWelcome = "ShowWelcome",
    AskConfirmation = "AskConfirmation",
    ShowStartPlayingBoard = "ShowStartPlayingBoard",
    ShowSelectDuration = "ShowSelectDuration",
    ShowSelectDurationCustom = "ShowSelectDurationCustom",
    ShowCreateLobby = "ShowCreateLobby",
    ShowJoinLobby = "ShowJoinLobby",
    ShowPlayAgainstBot = "ShowPlayAgainstBot",
    PlayByYourself = "PlayByYourself"
}

export enum LogConsoleOperation{
    Clear = "Clear"
}

export enum BoardEditorOperation{
    Enable = "Enable",
    FlipBoard = "FlipBoard",
    ResetBoard = "ResetBoard",
    ClearBoard = "ClearBoard",
    CreatePiece = "CreatePiece",
    RemovePiece = "RemovePiece",
    CreateBoard = "CreateBoard",
    EnableMovePieceCursorMode = "EnableMovePieceCursorMode",
    EnableRemovePieceCursorMode = "EnableRemovePieceCursorMode",
    ChangeBoardCreatorMode = "ChangeBoardCreatorMode",
    ToggleBoardEditorUtilityMenu = "ToggleBoardEditorUtilityMenu"
}

export type MenuOperation = BoardEditorOperation 
    | NavigatorModalOperation 
    | NotationMenuOperation 
    | LogConsoleOperation;