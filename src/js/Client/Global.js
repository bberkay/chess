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
    static #gl_killed_black_pieces = [];
    static #gl_killed_white_pieces = [];
    static #gl_white_king = null;
    static #gl_black_king = null;
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
     * Constructor
     */
    constructor(){
        // Set Empty at Start
        for (let i = 1; i < 65; i++)
            this.#gl_squares[i] = 0;
    }

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
     * Get Killed Black Pieces
     * @returns {Array<Piece>}
     */
    static getKilledBlackPieces(){
        return this.#gl_killed_black_pieces;
    }

    /**
     * @static 
     * Get Killed White Pieces
     * @returns {Array<Piece>}
     */
    static getKilledWhitePieces(){
        return this.#gl_killed_white_pieces;
    }

    /**
     * @static
     * Get White King
     * @returns {Piece}
     */
    static getWhiteKing(){
        if(this.#gl_white_king == null)
            this.setWhiteKing();

        return this.#gl_white_king;
    }

    /**
     * @static
     * Set White King
     * @returns {Piece}
     */
    static getBlackKing(){
        if(this.#gl_black_king == null)
            this.setBlackKing();

        return this.#gl_black_king;
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
    static getCastling(){
        return this.#gl_castling_control;
    }
    
    /**
     * @static
     * Get En passant Status
     * @returns {JSON}
     */
    static getEnPassant(){
        return this.#gl_en_passant_control;
    }

    /**
     * @static
     * Set Square
     * @param {int} square_id Square ID of square
     * @param {int|Piece} content Content of square
     * @returns {void}
     */
    static setSquare(square_id, content){
        this.#gl_squares[square_id] = content;
    }

    /**
     * @static
     * Set Current Move
     * @returns {void}
     */
    static setNextMove(){
        this.#gl_current_move = "white" ? "black" : "white";
    }

    /**
     * @static
     * Increase Move Count
     * @returns {void}
     */
    static increaseMoveCount(){
        this.#gl_move_count += 1;
    }

    /**
     * @static
     * Add Killed Black Piece
     * @param {Piece} piece Killed black piece
     * @returns {void}
     */
    static addKilledBlackPiece(piece){
        if(piece instanceof Piece == false || piece.color != "black")
            return;

        this.#gl_killed_black_pieces.push(piece);
    }

    /**
     * @static
     * Add Killed White Piece
     * @param {Piece} piece Killed white piece
     * @returns {void}
     */
    static addKilledWhitePiece(piece){
        if(piece instanceof Piece == false || piece.color != "white")
            return;

        this.#gl_killed_white_pieces.push(piece);
    }

    /**
     * @static
     * Set White King
     * @returns {void}
     */
    static setWhiteKing(){
        let squares = this.getSquares();
        for(let square of squares){
            let piece = squares[square];            
            if(piece.type == "king" && piece.color == "white"){
                this.#gl_white_king = piece;
                break;
            }
        }
    }

    /**
     * @static
     * Set White King
     * @returns {void}
     */
    static setBlackKing(){
        let squares = this.getSquares();
        for(let square of squares){
            let piece = squares[square];            
            if(piece.type == "king" && piece.color == "black"){
                this.#gl_white_king = piece;
                break;
            }
        }
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
        if(!Object.values(Castling).includes(value))
            return;

        this.#gl_castling_control[castling_type] = value;
    }

    /**
     * @static
     * Add En passant to list
     * @param {int} piece_id ID of piece
     * @param {EnPassant} value EN_PASSANT Enum
     * @returns {void}
     */
    static addEnPassant(piece_id, value){
        if(!Object.values(EnPassant).includes(value))
            return;

        this.#gl_en_passant_control[piece_id] = value;
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
 * Type Input Enum
 * @enum {string}
 */
const Type = {
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
const Castling = {
    WhiteLong:"white-long",
    WhiteSort:"white-sort",
    BlackLong:"black-long",
    BlackShort:"black-short"
}

/**
 * En Passant Enum
 * @enum {string}
 */
const EnPassant = {
    Ready:"ready",
    NotReady:"not-ready",
    Cant:"can't"
}