/**
 * MenuOperation enum for the types of operations that can be
 * done in/by the menu.
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
    ToggleNotationMenuUtilityMenu = "ToggleNotationMenuUtilityMenu",
}

/**
 * NavigatorModalOperation enum for the types of operations that can be
 * done in/by the navigator modal.
 */
export enum NavigatorModalOperation{
    Hide = "Hide",
    Undo = "Undo",
    ShowGameCreator = "ShowGameCreator",
    ShowWelcome = "ShowWelcome",
    AskConfirmation = "AskConfirmation",
    ShowStartPlayingBoard = "ShowStartPlayingBoard",
    ShowCreateLobby = "ShowCreateLobby",
    ShowJoinLobby = "ShowJoinLobby",
    PlayAgainstBot = "PlayAgainstBot",
    PlayWithYourself = "PlayWithYourself",
    CreateLobby = "CreateLobby",
    JoinLobby = "JoinLobby",
    EnableBoardEditor = "EnableBoardEditor",
    CancelGame = "CancelGame"
}

/**
 * LogConsoleOperation enum for the types of operations that can be
 * done in/by the log console.
 */
export enum LogConsoleOperation{
    Clear = "Clear"
}

/**
 * BoardEditorOperation enum for the types of operations that can be
 * done in/by the board editor.
 */
export enum BoardEditorOperation{
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

/**
 * MenuOperation type as a union of all the operation types.
 */
export type MenuOperation = BoardEditorOperation | NavigatorModalOperation | NotationMenuOperation | LogConsoleOperation;
