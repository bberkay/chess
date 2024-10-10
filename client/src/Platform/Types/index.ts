/**
 * PlatformEvent  enum is used to define the events 
 * that are triggered by the platform.
 * @enum {string}
 */
export enum PlatformEvent {
    /**
     * Triggered when a new board is created by the board editor.
     * @event
     */
    onBoardCreated = "OnBoardCreated",

    /**
     * Triggered when a component that has a data-menu-operation or 
     * data-socket-operation attribute is mounted.
     * @CustomEvent
     * @param {string|HTMLElement} selector - If a string is passed, 
     * the selector will be used as querySelectorAll(selector + data-menu/socket-operation).
     * If an HTMLElement is passed, the element directly will be used as data-menu/socket-operation.
     */
    onOperationMounted = "onOperationMounted",
}

export enum NotationMenuOperation{
    SendDrawOffer = "SendDrawOffer",
    SendUndoOffer = "SendUndoOffer",
    SendPlayAgainOffer = "SendPlayAgainOffer",
    Resign = "Resign",
    PlayAgain = "PlayAgain",
    PreviousMove = "PreviousMove",
    NextMove = "NextMove",
    LastMove = "LastMove",
    FirstMove = "FirstMove",
    GoBack = "GoBack",
    ShowOnlineGameUtilityMenu = "ShowOnlineGameUtilityMenu",
    ShowSingleplayerGameUtilityMenu = "ShowSingleplayerGameUtilityMenu",
    ShowNewGameUtilityMenu = "ShowNewGameUtilityMenu",
    ShowPlayAgainUtilityMenu = "ShowPlayAgainUtilityMenu",
    ToggleUtilityMenu = "ToggleUtilityMenu",
}

export enum NavigatorModalOperation{
    Hide = "Hide",
    Undo = "Undo",
    ShowGameCreator = "ShowGameCreator",
    AskConfirmation = "AskConfirmation",
    ShowStartPlayingBoard = "ShowStartPlayingBoard",
    ShowSelectDuration = "ShowSelectDuration",
    ShowSelectDurationCustom = "ShowSelectDurationCustom",
    ShowCreateLobby = "ShowCreateLobby",
    ShowJoinLobby = "ShowJoinLobby",
    ShowPlayAgainstBot = "ShowPlayAgainstBot",
    ShowSelectColorAgainsBot = "ShowSelectColorAgainsBot",
    PlayByYourself = "PlayByYourself",
    PlayAgainstBot = "PlayAgainstBot",
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

export enum NavbarOperation{
    ShowAbout = "ShowAbout",
    ShowLogConsole = "ShowLogConsole",
    ShowAppearance = "ShowAppearance",
    ShowConnections = "ShowConnections",
}

export enum AppearanceMenuOperation{
    Reset = "Reset",
    ChangeTheme = "ChangeTheme"
}

export type MenuOperation = BoardEditorOperation 
    | NavigatorModalOperation 
    | NotationMenuOperation 
    | LogConsoleOperation
    | NavbarOperation
    | AppearanceMenuOperation;