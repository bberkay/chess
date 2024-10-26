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

/**
 * Represents operations related to the
 * `BoardEditor` component.
 */
export enum BoardEditorOperation {
    Enable = "Enable",
    EnableMovePieceCursorMode = "EnableMovePieceCursorMode",
    EnableRemovePieceCursorMode = "EnableRemovePieceCursorMode",
    CreateBoard = "CreateBoard",
    CreatePiece = "CreatePiece",
    RemovePiece = "RemovePiece",
    ClearBoard = "ClearBoard",
    ResetBoard = "ResetBoard",
    FlipBoard = "FlipBoard",
    ChangeBoardCreatorMode = "ChangeBoardCreatorMode",
    ToggleBoardEditorUtilityMenu = "ToggleBoardEditorUtilityMenu",
}

/**
 * Represents operations related to the
 * `NotationMenu` component.
 */
export enum NotationMenuOperation {
    ShowNewGameUtilityMenu = "ShowNewGameUtilityMenu",
    ShowOnlineGameUtilityMenu = "ShowOnlineGameUtilityMenu",
    ShowSingleplayerGameUtilityMenu = "ShowSingleplayerGameUtilityMenu",
    ShowPlayAgainUtilityMenu = "ShowPlayAgainUtilityMenu",
    SendDrawOffer = "SendDrawOffer",
    SendUndoOffer = "SendUndoOffer",
    SendPlayAgainOffer = "SendPlayAgainOffer",
    UndoMove = "UndoMove",
    Resign = "Resign",
    AbortGame = "AbortGame",
    PlayAgain = "PlayAgain",
    PreviousMove = "PreviousMove",
    NextMove = "NextMove",
    LastMove = "LastMove",
    FirstMove = "FirstMove",
    GoBack = "GoBack",
    ToggleUtilityMenu = "ToggleUtilityMenu",
}

/**
 * Represents operations related to the
 * `NavigatorModal` component.
 */
export enum NavigatorModalOperation {
    ShowGameCreator = "ShowGameCreator",
    ShowStartPlayingBoard = "ShowStartPlayingBoard",
    ShowCreateLobby = "ShowCreateLobby",
    ShowSelectDuration = "ShowSelectDuration",
    ShowSelectDurationCustom = "ShowSelectDurationCustom",
    ShowJoinLobby = "ShowJoinLobby",
    ShowPlayAgainstBot = "ShowPlayAgainstBot",
    ShowSelectColorAgainsBot = "ShowSelectColorAgainsBot",
    PlayAgainstBot = "PlayAgainstBot",
    PlayByYourself = "PlayByYourself",
    AskConfirmation = "AskConfirmation",
    Hide = "Hide",
    Undo = "Undo",
}

/**
 * Represents operations related to the
 * `LogConsole` component.
 */
export enum LogConsoleOperation {
    Clear = "Clear",
}

/**
 * Represents operations related to the
 * `SettingsMenu` component.
 */
export enum SettingsMenuOperation {
    ChangeBoardSetting = "ChangeBoardSetting",
    ChangeNotationMenuSetting = "ChangeNotationMenuSetting",
    ChangeLogConsoleSetting = "ChangeLogConsoleSetting",
    ClearCache = "ClearCache", 
    ResetSettings = "ResetSettings",
}

/**
 * Represents operations related to the
 * `AppearanceMenu` component.
 */
export enum AppearanceMenuOperation {
    ChangeTheme = "ChangeTheme",
    Reset = "Reset",
}

/**
 * Represents operations related to the
 * `Navbar` component.
 */
export enum NavbarOperation {
    ShowAbout = "ShowAbout",
    ShowLogConsole = "ShowLogConsole",
    ShowAppearance = "ShowAppearance",
    ShowSettings = "ShowSettings",
}

/**
 * Represents a union type of all menu operations.
 */
export type MenuOperation =
    | BoardEditorOperation
    | NotationMenuOperation
    | NavigatorModalOperation
    | LogConsoleOperation
    | SettingsMenuOperation
    | AppearanceMenuOperation
    | NavbarOperation;
