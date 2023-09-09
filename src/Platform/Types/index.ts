/**
 * PlatformConfig interface for the configuration of the platform.
 * @see src/Platform/Platform.ts For more information.
 */
export interface PlatformConfig{
    createGameCreatorForm?: boolean;
    createNotationTable?: boolean;
    createLogConsole?: boolean;
}

/**
 * GameCreatorOperationType enum for the types of operations that can be
 * done in the game creator.
 * @see src/Platform/Components/GameCreatorForm.ts For more information.
 */
export enum GameCreatorOperationType{
    CreateGame = "CreateGame",
    ChangeMode = "ChangeMode"
}

/**
 * GameCreatorOperationValue enum for the values of operations that can be
 * done in the game creator.
 * @see src/Platform/Components/GameCreatorForm.ts For more information.
 */
export enum GameCreatorOperationValue{
    Custom = "Custom",
    Template = "Template"
}