import {
    WsTitle,
    WsData,
    WsConnectedData,
    WsCreatedData,
    WsStartedData,
    WsFinishedData,
    WsResignedData,
    WsUndoData,
    WsMovedData,
    WsDisconnectedData,
    WsReconnectedData,
    WsErrorData
} from "../Types";

/**
 * This class is used to create WebSocket commands
 * to send to the client.
 */
export class WsCommand {
    /**
    * Create a WebSocket command with the given command and data.
    * @example [Moved, {from: Square.a2, to: Square.a4}]
    * @example [Resigned]
    */
    private static _wsCommand<T extends WsTitle>(
       title: T,
       data: WsData<T> | null = null
   ): string {
       if (Object.values(WsTitle).indexOf(title) === -1)
           throw new Error("Invalid command.");

       return data ? JSON.stringify([title, data]) : JSON.stringify([title]);
   }

   /**
    * Send created command to the client.
    * @example [Connected, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
    */
   static created(createdData: WsCreatedData): string {
       return WsCommand._wsCommand(WsTitle.Created, createdData);
   }

   /**
    * Send connected command to the client.
    * @example [Connected, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
    */
   static connected(connectedData: WsConnectedData): string {
       return WsCommand._wsCommand(WsTitle.Connected, connectedData);
   }

   /**
    * Send started command to the client.
    * @example [STARTED, {board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", ...}]
    */
   static started(startedData: WsStartedData): string {
       return WsCommand._wsCommand(WsTitle.Started, startedData);
   }

   /**
    * Send finished command to the client.
    * @example [FINISHED, {gameStatus: GameStatus.Draw}]
    */
   static finished(finishedData: WsFinishedData): string {
       return WsCommand._wsCommand(WsTitle.Finished, finishedData);
   }

   /**
    * Send moved command to the client.
    * @example [MOVED, {from: Square.a2, to: Square.a4}]
    */
   static moved(moveData: WsMovedData): string {
       return WsCommand._wsCommand(WsTitle.Moved, moveData);
   }

   /**
    * Send aborted command to the client.
    */
   static aborted(): string {
       return WsCommand._wsCommand(WsTitle.Aborted);
   }

   /**
    * Send resigned command to the client.
    */
   static resigned(resignedData: WsResignedData): string {
       return WsCommand._wsCommand(WsTitle.Resigned, resignedData);
   }

   /**
    * Send draw accepted command to the client.
    * @example [DRAW_ACCEPTED]
    */
   static drawAccepted(): string {
       return WsCommand._wsCommand(WsTitle.DrawAccepted);
   }

   /**
    * Send undo accepted command to the client.
    * @example [UNDO_ACCEPTED, {board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", ...}]
    */
   static undoAccepted(undoData: WsUndoData): string {
       return WsCommand._wsCommand(WsTitle.UndoAccepted, undoData);
   }

   /**
    * Send draw offered command to the client.
    */
   static drawOffered(): string {
       return WsCommand._wsCommand(WsTitle.DrawOffered);
   }

   /**
    * Send undo offered command to the client.
    */
   static undoOffered(): string {
       return WsCommand._wsCommand(WsTitle.UndoOffered);
   }

   /**
    * Send play again offered command to the server.
    */
   static playAgainOffered(): string {
       return WsCommand._wsCommand(WsTitle.PlayAgainOffered);
   }

   /**
    * Send sent offer cancelled command to the client.
    */
   static sentOfferCancelled(): string {
       return WsCommand._wsCommand(WsTitle.SentOfferCancelled);
   }

   /**
    * Send offer declined command to the client.
    */
   static sentOfferDeclined(): string {
       return WsCommand._wsCommand(WsTitle.SentOfferDeclined);
   }

   /**
    * Send disconnected command to the client.
    * @example [DISCONNECTED, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
    */
   static disconnected(disconnectedData: WsDisconnectedData): string {
       return WsCommand._wsCommand(WsTitle.Disconnected, disconnectedData);
   }

   /**
    * Send reconnected command to the client.
    * @example [RECONNECTED, {lobbyId: "1234", player: {name: "Player1", color: "white"}}]
    */
   static reconnected(reconnectData: WsReconnectedData): string {
       return WsCommand._wsCommand(WsTitle.Reconnected, reconnectData);
   }

   /**
    * Send error command to the client.
    * @example [ERROR, {message: "Invalid move."}]
    */
   static error(errorData: WsErrorData): string {
       return WsCommand._wsCommand(WsTitle.Error, errorData);
   }

   /**
    * Parse the websocket message from the server.
    * @param message "[Moved, {from: Square.a2, to: Square.a4}]"
    * @example [Moved, {from: Square.a2, to: Square.a4}]
    */
   static parse<T extends WsTitle>(message: string): [T, WsData<T>] {
       try {
           return JSON.parse(message) as [T, WsData<T>];
       } catch (error: unknown) {
           throw new Error(
               "Invalid WebSocket message, the message could not be parsed: " +
                   (error instanceof Error ? error.message : "")
           );
       }
   }
}
