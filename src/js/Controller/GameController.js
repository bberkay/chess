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

// Set Empty at Start
for (let i = 1; i < 65; i++)
    gl_squares[i] = 0;


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
    "white-long": null,
    "white-short": null,
    "black-long": null,
    "black-short": null
};


class GameController {
    /**
     * Change Square Content to Piece[object] or 0[int]
     * @param {int} key
     * @param {(Piece|int)} value
     * @returns {void}
     */
    static changeSquareTo(key, value) {
        if (Object.is(key, int) && key < 65 && Object.is(value, Piece) || Object.is(value, int) && value === 0)
            gl_squares[key] = value;
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
    static isSquareHasPiece(square_id) {
        return gl_squares[square_id] != 0 ? true : false;
    }

    /**
     * Is square has enemy ?
     * @param {int} square_id Square ID of the target square
     * @param {string} active_color Color to compare(optional, color of the active square)
     * @param {Array<string>} specific_enemy Specific enemy types(optional)
     * @returns {boolean}
     */
    static isSquareHasEnemy(square_id, active_color = gl_current_move, specific_enemy = ["queen", "king", "pawn", "bishop", "rook", "knight"]) {
        let piece = this.getPieceBySquareID(square_id);
        if (piece && piece.color != active_color && specific_enemy.includes(piece.type))
            return true;
        return false;
    }

    /**
    * Set King
    * @param {Piece} king
    * @returns {void}
    */
    static setKing(king) {
        if (king.type == "king") {
            if (king.color == "white")
                gl_white_king = king;
            else if (king.color == "black")
                gl_black_king = king;
        }
    }


    /**
     * Get Player or Enemy King
     * @returns {Piece}
     */
    static getKing({ player = false, enemy = false }) {
        if (player == false && enemy == false) // If player and enemy are false then return player's king
            return gl_current_move == "white" ? gl_white_king : gl_black_king;
        else if (player == true && enemy == false)
            return gl_current_move == "white" ? gl_white_king : gl_black_king;
        else if (player == false && enemy == true)
            return gl_current_move == "white" ? gl_black_king : gl_white_king;
        else // If player and enemy are true then return player's king
            return gl_current_move == "white" ? gl_white_king : gl_black_king;
    }

    /**
     * Get Square ID of Player or Enemy King 
     * @returns {int}
     */
    static getKingSquareID({ player = false, enemy = false }) {
        return this.getSquareIDByPiece(this.getKing({ player: player, enemy: enemy }));
    }
}
