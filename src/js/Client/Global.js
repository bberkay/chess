class Global{
    /* 
        Squares and Pieces on the board 
        example:
        {
            1(square_id):Piece(object), -> piece on square
            2(square_id):0(int), -> 0 means square is empty
            .
            .
            64(square_id):Piece(object) -> piece on square
        }
    */
    static #gl_squares = {};

    /**
     * Current Game Informations
     */
    static #gl_current_move = "white";
    static #gl_checked_player = null;
    static #gl_move_count = 0;
    static #gl_id_list = []; // Pieces ID

    /**
     * Castling control 
     */
    static #gl_castling_control = {
        "white-long": true,
        "white-short": true,
        "black-long": true,
        "black-short": true
    };

    /**
     * Piece ID's of pawn that can en passant
     */
    static #gl_en_passant_control = {}

    /**
     * @static
     * Get Current Board
     * @returns {JSON}
     */
    static getSquares(){
        return this.#gl_squares;
    }

    /**
     * @static
     * Get Square Content
     * @param {int} square_id 
     * @returns {(Piece|int)}
     */
    static getSquare(square_id){        
        return this.#gl_squares[square_id];
    }

    /**
     * @static
     * Get Current Move
     * @returns {string}
     */
    static getCurrentMove(){
        return this.#gl_current_move;
    }
    
    /**
     * @static
     * Get Checked Player
     * @returns {string}
     */
    static getCheckedPlayer(){
        return this.#gl_checked_player;
    }

    /**
     * @static
     * Get Move Count
     * @returns {int}
     */
    static getMoveCount(){
        return this.#gl_move_count;
    }

    /**
     * @static
     * Get ID List of Pieces
     * @returns {Array<int>}
     */
    static getIdList(){
        return this.#gl_id_list;
    }

    /**
     * @static
     * Get Castling Status
     * @param {string} castling_type
     * @returns {JSON}
     */
    static getCastling(castling_type=null){
        if(castling_type)
            return this.#gl_castling_control[castling_type];

        return this.#gl_castling_control;
    }
    
    /**
     * @static
     * Get En passant Status
     * @param {(int|null)} pawn_id
     * @returns {(JSON|EnPassantStatus)}
     */
    static getEnPassantStatus(pawn_id=null){
        if(pawn_id)
            return this.#gl_en_passant_control[pawn_id];
        return this.#gl_en_passant_control;
    }

    /**
     * @static
     * Get Enemy Color
     * @returns {string}
     */
    static getEnemyColor(){
        return this.getCurrentMove() == Color.White ? Color.Black : Color.White;
    }

    /**
     * @static
     * Set Square
     * @param {int} square_id Square ID of square
     * @param {Piece} content Content of square(default 0)
     * @returns {void}
     */
    static setSquare(square_id, content=0){
        this.#gl_squares[square_id] = content;
    }

    /**
     * @static
     * Set Next Move
     * @returns {void}
     */
    static setNextMove(){
        this.#gl_current_move = this.#gl_current_move === Color.White ? Color.Black : Color.White;

        // Save to cache
        Cache.set("current-move", this.#gl_current_move);
    }

    /**
     * @static
     * Increase Move Count
     * @returns {void}
     */
    static increaseMoveCount(){
        this.#gl_move_count += 1;

        // Save to cache
        Cache.set("move-count", this.#gl_move_count);
    }

    /**
     * @static
     * Set Current Move
     * @param {string} move 
     * @returns {void}
     */
    static setCurrentMove(move){
        this.#gl_current_move = move;

        // Save to cache
        Cache.set("current-move", this.#gl_current_move);
    }

    /**
     * @static
     * Set Move Count
     * @param {int} count
     * @returns {void}
     */
    static setMoveCount(count){
        this.#gl_move_count = count;

        // Save to cache
        Cache.set("move-count", this.#gl_move_count);
    }

    /**
     * @static
     * Add id to Id List
     * @param {int} id
     * @returns {void}
     */
    static addIdList(id){
        this.#gl_id_list.push(id);
    }

    /**
     * @static
     * Set Castling
     * @param {Castling} castling_type Castling Enum
     * @param {boolean} value 
     * @returns {void}
     */
    static setCastling(castling_type, value){
        this.#gl_castling_control[castling_type] = value;
    }

    /**
     * @static
     * Add En passant to list
     * @param {int} piece_id ID of piece
     * @param {EnPassant} en_passant_value EN_PASSANT Enum
     * @returns {void}
     */
    static addEnPassant(piece_id, en_passant_value){
        this.#gl_en_passant_control[piece_id] = en_passant_value;
    }

    /**
     * @static
     * Set En passant
     * @param {JSON} en_passant_value
     * @returns {void}
     */
    static setEnPassant(en_passant_value){
        this.#gl_en_passant_control = en_passant_value;
    }

    /**
     * @static
     * Set Checked Player
     * @param {Color|null} color Color of player
     * @returns {void}
     */
    static setCheckedPlayer(color=null){
        this.#gl_checked_player = color;

        // Save to cache
        Cache.set("checked-player", this.#gl_checked_player);
    }

}

/**
 * ===================== ENUMS =====================
 */

/**
 * Square Input Enum
 * @enum {number} 
 */
const Square = {
    A1: 57,
    A2: 49,
    A3: 41,
    A4: 33,
    A5: 25,
    A6: 17,
    A7: 9,
    A8: 1,
    B1: 58,
    B2: 50,
    B3: 42,
    B4: 34,
    B5: 26,
    B6: 18,
    B7: 10,
    B8: 2,
    C1: 59,
    C2: 51,
    C3: 43,
    C4: 35,
    C5: 27,
    C6: 19,
    C7: 11,
    C8: 3,
    D1: 60,
    D2: 52,
    D3: 44,
    D4: 36,
    D5: 28,
    D6: 20,
    D7: 12,
    D8: 4,
    E1: 61,
    E2: 53,
    E3: 45,
    E4: 37,
    E5: 29,
    E6: 21,
    E7: 13,
    E8: 5,
    F1: 62,
    F2: 54,
    F3: 46,
    F4: 38,
    F5: 30,
    F6: 22,
    F7: 14,
    F8: 6,
    G1: 63,
    G2: 55,
    G3: 47,
    G4: 39,
    G5: 31,
    G6: 23,
    G7: 15,
    G8: 7,
    H1: 64,
    H2: 56,
    H3: 48,
    H4: 40,
    H5: 32,
    H6: 24,
    H7: 16,
    H8: 8,
}

/**
 * Color Input Enum
 * @enum {string}
 */
const Color = {
    White:"white",
    Black:"black"
}

/**
 * Piece Type Input Enum
 * @enum {string}
 */
const PieceType = {
    Knight:"knight",
    Queen:"queen",
    King:"king",
    Bishop:"bishop",
    Rook:"rook",
    Pawn:"pawn",
}

/**
 * Castling Enum
 * @enum {string}
 */
const CastlingType = {
    WhiteLong:"white-long",
    WhiteShort:"white-short",
    BlackLong:"black-long",
    BlackShort:"black-short",
    Short:"short",
    Long:"long"
}

/**
 * En Passant Enum
 * @enum {string}
 */
const EnPassantStatus = {
    Can:"can",
    Ready:"ready",
    NotReady:"not-ready",
    Cant:"cant"
}

/**
 * Route Enum
 * @enum {string}
 */
const Route = {
    BottomLeft:"bottom-left",
    BottomRight:"bottom-right",
    TopLeft:"top-left",
    TopRight:"top-right",
    Bottom:"bottom",
    Top:"top",
    Left:"left",
    Right:"right",
}

/**
 * Validation Type Enum
 * @enum {(string|Enum)}
 */
const ValidationType = {
    Number:"number",
    String:"string",
    Boolean:"boolean",
    Object:"object",
    Color:Color,
    PieceType:PieceType,
    CastlingType:CastlingType,
    EnPassantStatus:EnPassantStatus
}

/**
 * SquareEffect Enum
 * @enum {string}
 */
const SquareEffect = {
    Checked:"checked-effect", 
    Killable:"killable-effect", 
    Playable:"playable-effect",
    Selected:"selected-effect"
}

/**
 * Square Click Move Type Enum
 * @enum {string}
 */
const SquareClickMode = {
    SelectPiece:"selectPiece",
    MovePiece:"movePiece",
    ClickSquare:"clickSquare",
    Castling:"castling",
}

/**
 * Start Position Enum
 * @enum {string}
 */
const StartPosition = {
    Castling:[
        {
            "color":Color.White,
            "piece":PieceType.Rook,
            "square":Square.H1,
        },
        {
            "color":Color.White,
            "piece":PieceType.Rook,
            "square":Square.A1,
        },
        {
            "color":Color.White,
            "piece":PieceType.King,
            "square":Square.E1,
        },
        {
            "color":Color.Black,
            "piece":PieceType.Bishop,
            "square":Square.G7,
        }
    ],
    EnPassant:[
        {
            "color":Color.White,
            "piece":PieceType.Pawn,
            "square":Square.E2,
        },
        {
            "color":Color.White,
            "piece":PieceType.Pawn,
            "square":Square.F2,
        },
        {
            "color":Color.Black,
            "piece":PieceType.Pawn,
            "square":Square.D7,
        },
        {
            "color":Color.Black,
            "piece":PieceType.Pawn,
            "square":Square.C7,
        }
    ],
    Check1:[
        {
            "color":Color.Black,
            "piece":PieceType.King,
            "square":Square.E1,
        },
        {
            "color":Color.White,
            "piece":PieceType.Queen,
            "square":Square.H5,
        },
        {
            "color":Color.Black,
            "piece":PieceType.Rook,
            "square":Square.G2,
        }
    ],
    Check2:[
        {
            "color":Color.White,
            "piece":PieceType.King,
            "square":Square.E8,
        },
        {
            "color":Color.Black,
            "piece":PieceType.Rook,
            "square":Square.F1,
        },
        {
            "color":Color.Black,
            "piece":PieceType.Rook,
            "square":Square.D1,
        }
    ]
}