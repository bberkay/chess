/**
 * MenuOperation enum for the types of operations that can be
 * done in the menu.
 * @see src/Platform/Platform.ts
 */
export enum MenuOperation{
    CreateGame = "CreateGame",
    ChangeMode = "ChangeMode",
    ClearConsole = "ClearConsole",
    FlipBoard = "FlipBoard",
    Reset = "Reset",
    ToggleUtilityMenu = "ToggleUtilityMenu",
    SendDrawOffer = "SendDrawOffer",
    SendUndoOffer = "SendUndoOffer",
    Resign = "Resign",
    PlayAgainstBot = "PlayAgainstBot",
    PlayAgainstFriend = "PlayAgainstFriend",
    CreateBoard = "CreateBoard",
    OpenGameCreator = "OpenGameCreator",
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