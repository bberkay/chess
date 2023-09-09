import { Chess } from "../Chess/Chess";
import { GameCreatorForm } from "./Components/GameCreatorForm";
import { PlatformConfig, GameCreatorOperationType, GameCreatorOperationValue } from "./Types";

export class Platform{

    private readonly chess: Chess;
    private readonly gameCreatorForm: GameCreatorForm | null;
    //private readonly notationTable: NotationTable | null;
    //private readonly logConsole: LogConsole | null;

    /**
     * Constructor of the Platform class.
     */
    constructor(chess: Chess, platformConfig: PlatformConfig = {createGameCreatorForm: true, createNotationTable: true, createLogConsole: true}) {
        this.chess = chess;
        this.gameCreatorForm = platformConfig.createGameCreatorForm ? new GameCreatorForm() : null;
        //this.notationTable = platformConfig.createNotationTable ? new NotationTable() : null;
        //this.logConsole = platformConfig.createLogConsole ? new LogConsole() : null;
    }

    /**
     * This function makes an operation on menu.
     */
    public doActionOnMenu(operationType: GameCreatorOperationType, operationValue: GameCreatorOperationValue): void
    {
        switch(operationType){
            case GameCreatorOperationType.CreateGame:
                if(this.gameCreatorForm === null)
                    throw new Error("Game creator form is not initialized.");

                // Create a new game with input value by given operation value.
                this.chess.createGame(this.gameCreatorForm.getValueByMode(operationValue));
                break;
            case GameCreatorOperationType.ChangeMode:
                if(this.gameCreatorForm === null)
                    throw new Error("Game creator form is not initialized.");

                // Change mode of game creator form.
                this.gameCreatorForm.changeMode(operationValue);
                break;
        }
    }
}