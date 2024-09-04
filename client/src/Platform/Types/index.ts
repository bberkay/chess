/**
 * MenuOperation enum for the types of operations that can be
 * done in the menu.
 * @see src/Platform/Platform.ts
 */
export enum NotationMenuOperation{
    SendDrawOffer = "SendDrawOffer",
    SendUndoOffer = "SendUndoOffer",
    Resign = "Resign",
    PreviousMove = "PreviousMove",
    NextMove = "NextMove",
    LastMove = "LastMove",
    FirstMove = "FirstMove",
    ToggleUtilityMenu = "ToggleUtilityMenu",
}

export enum NavigatorModalOperation{
    Hide = "Hide",
    Undo = "Undo",
    ShowGameCreator = "ShowGameCreator",
    ShowWelcome = "ShowWelcome",
    AskConfirmation = "AskConfirmation",
    PlayAgainstBot = "PlayAgainstBot",
    CreateLobby = "CreateLobby",
    EnableBoardEditor = "EnableBoardEditor",
    CancelGame = "CancelGame"
}

export enum LogConsoleOperation{
    Clear = "Clear"
}

export enum BoardEditorOperation{
    Flip = "Flip",
    Reset = "Reset",
    ClearBoard = "ClearBoard",
    CreatePiece = "CreatePiece",
    RemovePiece = "RemovePiece",
    CreateBoard = "CreateBoard",
    EnableAddPieceCursorMode = "AddPieceCursorMode",
    EnableRemovePieceCursorMode = "RemovePieceCursorMode",
    ChangeBoardCreatorMode = "ChangeBoardCreatorMode",
    ToggleUtilityMenu = "ToggleUtilityMenu"
}

export type MenuOperation = BoardEditorOperation | NavigatorModalOperation | NotationMenuOperation | LogConsoleOperation;
