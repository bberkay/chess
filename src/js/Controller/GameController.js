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
var gl_squares = {};

/*
    All Pieces(for control id and find piece easily)
    example:
    [
        11(id):Piece(object),
        84(id):Piece(object)
    ]
*/
var gl_pieces = {};


// other global variables
var gl_current_move = "white";
var gl_checked_player = null;
var gl_move_count = 0;
var gl_killed_black_pieces = [];
var gl_killed_white_pieces = [];
var gl_white_king = null;
var gl_black_king = null;

/**
 * Castling control 
 * null for starting and can be done
 * true for done
 * false for can't be done anymore
 */
var gl_castling_control = {
    "white-long":null,
    "white-short":null,
    "black-long":null,
    "black-short":null
};


class GameController {
    /**
     * Set Global Square
     * @param {int} key
     * @param {Piece|int} value
     * @returns {void}
     */
    static setGlobalSquare(key, value) {
        gl_squares[key] = value;
    }

    /**
     * Set Global Piece
     * @param {int} id
     * @param {Piece} piece
     * @returns {void}
     */
    static setGlobalPiece(id, piece) {
        gl_pieces[id] = piece;
    }

    /**
     * Create ID for Piece
     * @returns {int}
     */
    static createPieceID() {
        const id = 100 - Math.floor(Math.random() * 101) + 10;
        if (!gl_pieces[id])
            return id;
        else
            GameController.createPieceID();
    }


    /**
     * Get Active Pieces On The Board With Filter Like Enemy Queen, Enemy Bishops ... etc.
     * @param {string} type Type of pieces to get
     * @param {string} color Color of pieces to get
     * @returns {(Array<Piece>|null)}
     */
    static getActivePiecesWithFilter(type, color) {
        let pieces = [];
        for (let square in gl_squares) {
            let piece = this.getPieceBySquareID(parseInt(square));
            if (piece.color == color && piece.type == type)
                pieces.push(piece);
        }

        return pieces.length > 0 ? pieces : null;
    }

    /**
     * Get Piece By Square ID
     * @param {int} square_id 
     * @returns {(Piece|boolean)} 
     */
    static getPieceBySquareID(square_id) {
        return gl_squares[square_id] != 0 ? gl_squares[square_id] : false;
    }


    /**
     * Get Square ID By Piece
     * @param {Piece} piece 
     * @returns {(int|boolean)} 
     */
    static getSquareIDByPiece(piece) {
        for (let k in gl_squares) {
            if (gl_squares[k] == piece)
                return parseInt(k);
        }
        return false;
    }

    /**
     * Is Square Has Piece ?
     * @param {int} square_id Square ID of the target square
     * @returns {boolean}
     */
    static isSquareHasPiece(square_id){
        return gl_squares[square_id] != 0 ? true : false;
    }

    /**
     * Is square has enemy ?
     * @param {int} square_id Square ID of the target square
     * @param {string} opt_compare_color Color to compare(optional)
     * @returns {boolean}
     */
    static isSquareHasEnemy(square_id, opt_compare_color = false){
        if(!opt_compare_color)
            opt_compare_color = gl_current_move;

        if (this.isSquareHasPiece(square_id) && this.getPieceBySquareID(square_id).color != opt_compare_color)
            return true;
        else
            return false;
    }

    /**
     * Move Piece To Square
     * @param {int} from Square ID of the piece to move
     * @param {int} to Square ID of the target square
     * @returns {(int|void)}
     */
    static changePiecePosition(from, to) {
        let piece = this.getPieceBySquareID(from);
        this.setGlobalSquare(from, 0);
        this.setGlobalSquare(to, piece);
    }

    /**
     * Get Player or Enemy King
     * @returns {Piece}
     */
    static getKing({player = false, enemy = false}){
        if(player == false && enemy == false) // If player and enemy are false then return player's king
            return gl_current_move == "white" ? gl_white_king : gl_black_king;
        else if(player == true && enemy == false) 
            return gl_current_move == "white" ? gl_white_king : gl_black_king;
        else if(player == false && enemy == true)
            return gl_current_move == "white" ? gl_black_king : gl_white_king;
        else // If player and enemy are true then return player's king
            return gl_current_move == "white" ? gl_white_king : gl_black_king;
    }

    /**
     * Get Square ID of Player or Enemy King 
     * @returns {int}
     */
    static getKingSquareID({player = false, enemy = false}){
        return this.getSquareIDByPiece(this.getKing({player:player, enemy:enemy}));
    }
}
