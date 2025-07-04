/**
 * @module Platform
 * @description This module provides components like notation menu, board editor etc.
 * to enrich the user experience by using the `Chess` class's methods.
 * @author Berkay Kaya <berkaykayaforbusiness@gmail.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import { Chess } from "@Chess/Chess";
import { Navbar } from "./Components/Navbar";
import { BoardEditor } from "./Components/BoardEditor.ts";
import { NotationMenu } from "./Components/NotationMenu.ts";
import { NavigatorModal } from "./Components/NavigatorModal";
import {
    AppearanceMenuOperation,
    BoardEditorOperation,
    LogConsoleOperation,
    MenuOperation,
    NavbarOperation,
    NavigatorModalOperation,
    NotationMenuOperation,
    PlatformEvent,
    SettingsMenuOperation,
} from "./Types";
import {
    ChessEvent,
    Color,
    GameStatus,
    JsonNotation,
    StartPosition,
} from "@Chess/Types/index.ts";
import { LogConsole } from "./Components/NavbarComponents/LogConsole";
import { AboutMenu } from "./Components/NavbarComponents/AboutMenu.ts";
import { AppearanceMenu } from "./Components/NavbarComponents/AppearanceMenu.ts";
import { Logger } from "@Services/Logger";
import { Store, StoreKey } from "@Services/Store";
import { SettingsMenu } from "./Components/NavbarComponents/SettingsMenu.ts";
import { BotAttributes } from "@ChessPlatform/Chess/Bot/index.ts";
/**
 * This class is the main class of the chess platform menu.
 * It provides the components of the menu and connections between the chess and menu.
 */
export class Platform {
    private readonly chess: Chess;
    public readonly navbar: Navbar;
    public readonly boardEditor: BoardEditor;
    public readonly notationMenu: NotationMenu;
    public readonly navigatorModal: NavigatorModal;
    public readonly logConsole: LogConsole;
    public readonly appearanceMenu: AppearanceMenu;
    public readonly settingsMenu: SettingsMenu;
    public readonly aboutMenu: AboutMenu;
    public readonly logger: Logger = new Logger("src/Platform/Platform.ts");

    /**
     * Constructor of the Platform class.
     */
    constructor(chess: Chess) {
        this.chess = chess;
        this.boardEditor = new BoardEditor(this.chess);
        this.notationMenu = new NotationMenu(this.chess);
        this.navigatorModal = new NavigatorModal(this.chess);
        this.appearanceMenu = new AppearanceMenu();
        this.logConsole = new LogConsole();
        this.aboutMenu = new AboutMenu();
        this.settingsMenu = new SettingsMenu(
            this.chess,
            this.logConsole,
            this.notationMenu
        );
        this.navbar = new Navbar(
            this.logConsole,
            this.aboutMenu,
            this.settingsMenu,
            this.appearanceMenu
        );
        this.init();

        //For testing purposes
        //document.addEventListener("keydown", (event) => {
        //    if (event.ctrlKey && event.key === " ") Store.clear();
        //});
    }

    /**
     * Initialize the platform by checking the cache and
     * handling the menu operations.
     */
    private init(): void {
        /**
         * Find the menu operations and bind them to the menu
         * items. When the user clicks on the menu item, the
         * operation will be executed.
         */
        const bindMenuOperations = () => {
            document
                .querySelectorAll("[data-menu-operation]")
                .forEach((menuItem) => {
                    menuItem.addEventListener("click", () => {
                        this.handleMenuOperation(menuItem as HTMLElement);
                    });
                });

            document.addEventListener(PlatformEvent.onOperationMounted, ((
                event: CustomEvent
            ) => {
                if (typeof event.detail.selector === "string") {
                    const menuOperations = document.querySelectorAll(
                        `${event.detail.selector} [data-menu-operation]`
                    );
                    if (!menuOperations) return;
                    menuOperations.forEach((menuItem) => {
                        menuItem.addEventListener("click", () => {
                            this.handleMenuOperation(menuItem as HTMLElement);
                        });
                    });
                } else if (event.detail.selector instanceof HTMLElement) {
                    if (
                        !event.detail.selector.hasAttribute(
                            "data-menu-operation"
                        )
                    )
                        return;
                    event.detail.selector.addEventListener("click", () => {
                        this.handleMenuOperation(
                            event.detail.selector as HTMLElement
                        );
                    });
                }
            }) as EventListener);

            this.logger.save(
                "Menu operations are binded to loaded components."
            );
        };

        document.addEventListener(ChessEvent.onBotAdded, ((
            event: CustomEvent
        ) => {
            if (event.detail.color === Color.White)
                this._flipBoardAndComponents();
        }) as EventListener);

        /**
         * Show the log console when there is a move
         * for first time after the platform is initialized.
         */
        const showLogConsoleOnMove = () => {
            if(this.navbar.getShownComponent() !== this.logConsole) {
                this.navbar.showComponent(this.logConsole);
            }

            document.removeEventListener(ChessEvent.onPieceMoved, showLogConsoleOnMove);
        }
        document.addEventListener(ChessEvent.onPieceMoved, showLogConsoleOnMove);

        bindMenuOperations();
        this.logger.save(
            "Platform Events are added. Menu operations are binded. Platform is initialized."
        );
    }

    /**
     * This function makes an operation on menu.
     */
    private handleMenuOperation(menuItem: HTMLElement): void {
        /**
         * Ensures that the provided menu operation exists in only one enum.
         *
         * @param {MenuOperation} menuOperation - The operation to check for uniqueness.
         * @throws Will throw an error if the same menu operation appears in more than one enum.
         */
        const ensureUniqueMenuOperation = (menuOperation: MenuOperation) => {
            const allMenuOperations = [
                ...Object.values(BoardEditorOperation),
                ...Object.values(NavigatorModalOperation),
                ...Object.values(NotationMenuOperation),
                ...Object.values(LogConsoleOperation),
                ...Object.values(NavbarOperation),
                ...Object.values(AppearanceMenuOperation),
                ...Object.values(SettingsMenuOperation),
            ];

            if (
                allMenuOperations.filter(
                    (operation) => operation === menuOperation
                ).length > 1
            ) {
                throw new Error(
                    `The menu operation "${menuOperation}" appears in more than one enum.`
                );
            }
        };

        const menuOperation = menuItem.getAttribute(
            "data-menu-operation"
        ) as MenuOperation;
        ensureUniqueMenuOperation(menuOperation);
        if (Object.hasOwn(LogConsoleOperation, menuOperation)) {
            this.logConsole.handleOperation(
                menuOperation as LogConsoleOperation
            );
            /*this.handleLogConsoleOperation(
                menuOperation as LogConsoleOperation,
                menuItem
            );*/
        } else if (Object.hasOwn(AppearanceMenuOperation, menuOperation)) {
            this.appearanceMenu.handleOperation(
                menuOperation as AppearanceMenuOperation
            );
            /*this.handleAppearanceMenuOperation(
                menuOperation as AppearanceMenuOperation,
                menuItem
            );*/
        } else if (Object.hasOwn(SettingsMenuOperation, menuOperation)) {
            this.settingsMenu.handleOperation(
                menuOperation as SettingsMenuOperation,
                menuItem
            );
            /*this.handleSettingsMenuOperation(
                menuOperation as SettingsMenuOperation,
                menuItem
            );*/
        } else if (Object.hasOwn(NavigatorModalOperation, menuOperation)) {
            this.navigatorModal.handleOperation(
                menuOperation as NavigatorModalOperation
            );
            this.handleNavigatorModalOperation(
                menuOperation as NavigatorModalOperation
            );
        } else if (Object.hasOwn(NotationMenuOperation, menuOperation)) {
            this.notationMenu.handleOperation(
                menuOperation as NotationMenuOperation
            );
            this.handleNotationMenuOperation(
                menuOperation as NotationMenuOperation
            );
        } else if (Object.hasOwn(BoardEditorOperation, menuOperation)) {
            this.boardEditor.handleOperation(
                menuOperation as BoardEditorOperation,
                menuItem
            );
            this.handleBoardEditorOperation(
                menuOperation as BoardEditorOperation
            );
        } else if (Object.hasOwn(NavbarOperation, menuOperation)) {
            this.navbar.handleOperation(menuOperation as NavbarOperation);
            /*this.handleNavbarOperation(
                menuOperation as NavbarOperation,
                menuItem
            );*/
        }
    }

    /**
     * A template function for handling menu operations.
     * /
    private handleSomeMenuOperation(menuOperation: SomeMenuOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
        }
    }
    */

    /**
     * Handle the notation menu operations.
     */
    private handleNotationMenuOperation(
        menuOperation: NotationMenuOperation
    ): void {
        switch (menuOperation) {
            case NotationMenuOperation.AbortGame:
                this._abortSingleplayerGame();
                break;
            case NotationMenuOperation.Resign:
                this._resignFromSingleplayerGame();
                break;
            case NotationMenuOperation.PlayAgain:
                this._playAgainSingleplayerGame();
                break;
            case NotationMenuOperation.UndoMove:
                this._undoMoveAndHandleComponents();
                break;
        }
    }

    /**
     * Handle the navigator modal operations.
     */
    private handleNavigatorModalOperation(
        menuOperation: NavigatorModalOperation
    ): void {
        switch (menuOperation) {
            case NavigatorModalOperation.PlayByYourself:
                this.preparePlatformForSingleplayerGameByYourself();
                break;
            case NavigatorModalOperation.PlayAgainstBot:
                this.preparePlatformForSingleplayerGameAgainstBot();
                break;
        }
    }

    /**
     * Handle the board editor operations.
     */
    private handleBoardEditorOperation(
        menuOperation: BoardEditorOperation
    ): void {
        switch (menuOperation) {
            case BoardEditorOperation.Enable:
                this._enableBoardEditorAndHanleComponents();
                break;
            case BoardEditorOperation.FlipBoard:
                this._flipBoardAndComponents();
                break;
            case BoardEditorOperation.CreateBoard:
                this._createBoardAndHandleComponents();
                break;
        }
    }

    /**
     * Enable the board editor and handle the components
     * of the platform by hiding the navigator modal, clearing
     * the log console and etc.
     */
    private _enableBoardEditorAndHanleComponents(): void {
        this.notationMenu.hide();
        this.navigatorModal.hide();
        this.logConsole.clear();
        this.boardEditor.enableEditorMode();
        document.dispatchEvent(new Event(PlatformEvent.onBoardCreated));
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private _createBoardAndHandleComponents(
        notation: string | StartPosition | JsonNotation | null = null
    ): void {
        this.navigatorModal.hide();
        this.navbar.showComponent(this.logConsole);
        this.logConsole.clear();
        if (!BoardEditor.isEditorModeEnable()) {
            this.notationMenu.clear();
            this.boardEditor.createBoard(notation);
        } else {
            this.notationMenu.hide();
            if(notation && typeof notation !== "string")
                throw new Error("Notation type must be string while piece editor is active.");
            this.boardEditor.createEditableBoard(notation);
        }
        this.logger.save(`Board is created and components are updated.`);
    }

    /**
     * Prepare the platform components for the online game.
     */
    public preparePlatformForOnlineGame(
        createdGame: {
            whitePlayer: { id: string; name: string; isOnline: boolean };
            blackPlayer: { id: string; name: string; isOnline: boolean };
            game: string | JsonNotation;
        },
        playerColor: Color
    ): void {
        if (BoardEditor.isEditorModeEnable()){
            this.boardEditor.disableEditorMode();
            this.notationMenu.show();
        }

        this._createBoardAndHandleComponents(createdGame.game);
        this.chess.board.lockActionsOfColor(
            playerColor === Color.White ? Color.Black : Color.White
        );
        this.notationMenu.displayOnlineGameUtilityMenu();
        this.notationMenu.setPlayersOnPlayerCards(
            createdGame.whitePlayer,
            createdGame.blackPlayer
        );
        this.notationMenu.setTurnIndicator(this.chess.getTurnColor());
        this.notationMenu.update(true);

        if (playerColor === Color.Black) this._flipBoardAndComponents();

        if (playerColor !== this.chess.getTurnColor())
            this.chess.board.lock();
        else this.chess.board.unlock();

        this.logger.save(`Online game is created and components are updated.`);
    }

    /**
     * Create a new game and update the components of the menu.
     * @param {boolean|BotAttributes} bot
     * If the boolean is true, the settings will be taken from the navigator modal
     * or this.chess.getBotSettings() method(the last bot created bot's settings if exists).
     * If the object is provided, the bot will be added to the game with the given color
     * and difficulty.
     * If the boolean is false, the game will be created without bot.
     */
    private preparePlatformForSingleplayerGame(
        notation: string | StartPosition | JsonNotation | null = null,
        bot: boolean | BotAttributes = false,
    ): void {
        if (BoardEditor.isEditorModeEnable()){
            this.boardEditor.disableEditorMode();
            this.notationMenu.show();
        }

        let botAttributes =
            bot && typeof bot === "object"
                ? bot
                : this.navigatorModal.getCreatedBotSettings();

        this._createBoardAndHandleComponents(notation);
        this.notationMenu.displaySingleplayerGameUtilityMenu();

        if (bot) {
            if (!botAttributes && this.chess.getLastCreatedBotAttributes())
                botAttributes = this.chess.getLastCreatedBotAttributes()!;
            this.chess.addBotToCurrentGame(botAttributes);
        }

        this.notationMenu.showPlayerCards();
        this.notationMenu.setTurnIndicator(this.chess.getTurnColor());

        this.logger.save(`Editor mode is disabled and board is now playable.`);
        Store.clear(StoreKey.WasBoardEditorEnabled);
        document.dispatchEvent(new Event(PlatformEvent.onBoardCreated));
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private preparePlatformForSingleplayerGameByYourself(): void {
        this.preparePlatformForSingleplayerGame();
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private preparePlatformForSingleplayerGameAgainstBot(): void {
        this.preparePlatformForSingleplayerGame(null, true);
    }

    /**
     * Undo the last move and update the components of the menu.
     */
    private _undoMoveAndHandleComponents(): void {
        if (
            this.notationMenu.isOperationConfirmed(
                NotationMenuOperation.UndoMove
            )
        ) {
            const botAttributes = this.chess.getLastCreatedBotAttributes();
            if (botAttributes) {
                const playerColor =
                    botAttributes.color === Color.White
                        ? Color.Black
                        : Color.White;
                this.chess.takeBack(true, playerColor);
            } else {
                this.chess.takeBack(true);
            }
            this.notationMenu.goBack();
        }
    }

    /**
     * Flip the board and notation menu.
     */
    private _flipBoardAndComponents(): void {
        this.boardEditor.flip();
        if (!BoardEditor.isEditorModeEnable()) this.notationMenu.flip();
    }

    /**
     * Abort the singleplayer game and show the
     * game over modal.
     */
    private _abortSingleplayerGame(): void {
        if (
            !this.notationMenu.isOperationConfirmed(
                NotationMenuOperation.AbortGame
            )
        )
            return;

        this.chess.engine.setGameStatus(GameStatus.Draw);
        this.chess.finishTurn();
        this.navigatorModal.showGameOverAsAborted();
    }

    /**
     * Resign from the singleplayer game and show the
     * game over modal.
     */
    private _resignFromSingleplayerGame(): void {
        if (
            !this.notationMenu.isOperationConfirmed(
                NotationMenuOperation.Resign
            )
        )
            return;

        const botAttributes = this.chess.getLastCreatedBotAttributes();
        const resignColor = botAttributes
            ? botAttributes.color == Color.White
                ? Color.Black
                : Color.White
            : this.chess.getTurnColor();
        this.chess.engine.setGameStatus(
            resignColor == Color.White
                ? GameStatus.BlackVictory
                : GameStatus.WhiteVictory
        );
        this.chess.finishTurn();
        this.navigatorModal.showGameOverAsResigned(resignColor);
    }

    /**
     * Play again the singleplayer game and
     * update the components.
     */
    private _playAgainSingleplayerGame(): void {
        const botAttributes = this.chess.getLastCreatedBotAttributes() ?? false;
        if(botAttributes) botAttributes.color = botAttributes.color == Color.White ? Color.Black : Color.White;
        this.preparePlatformForSingleplayerGame(this.chess.getBoardHistory()[0], botAttributes);
    }
}
