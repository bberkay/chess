/**
 * MenuOperationType enum for the types of operations that can be
 * done in the menu.
 * @see src/Platform/Platform.ts
 */
export enum MenuOperationType{
    GameCreatorCreate = "GameCreatorCreateGame",
    GameCreatorChangeMode = "GameCreatorChangeMode",
    LogConsoleClear = "LogConsoleClear",
    ToggleSquareIds = "ToggleSquareIds"
}

/**
 * MenuOperationValue enum for the values of operations that can be
 * done in the menu.
 * @see src/Platform/Platform.ts
 */
export enum MenuOperationValue{
    GameCreatorCustom = "GameCreatorCustom",
    GameCreatorTemplate = "GameCreatorTemplate"
}