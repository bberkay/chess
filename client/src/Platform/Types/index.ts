/**
 * MenuOperation enum for the types of operations that can be
 * done in the menu.
 * @see src/Platform/Platform.ts
 */
export enum MenuOperation{
    ChangeMode = "ChangeMode",
    ClearConsole = "ClearConsole",
    FlipBoard = "FlipBoard",
    ResetBoard = "ResetBoard",
    ToggleUtilityMenu = "ToggleUtilityMenu",
    SendDrawOffer = "SendDrawOffer",
    SendUndoOffer = "SendUndoOffer",
    Resign = "Resign",
    PlayAgainstBot = "PlayAgainstBot",
    CreateLobby = "CreateLobby",
    CreateBoard = "CreateBoard",
    ShowGameCreatorModal = "ShowGameCreatorModal",
    HideNavigatorModal = "HideNavigatorModal",
    ShowWelcomeModal = "ShowWelcomeModal",
    CancelGame = "CancelGame",
    AskConfirmation = "AskConfirmation",
    UndoNavigatorModal = "UndoNavigatorModal",
}

/**
 * UtilityMenuSection enum for the types of sections that can be
 * displayed in the utility menu.
 * @see src/Platform/Components/NotationMenu.ts
 */
export enum UtilityMenuSection{
    Match = "match",
    Board = "board",
    NewGame = "new-game"
}
