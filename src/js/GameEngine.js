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


class GameEngine {
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
            GameEngine.createPieceID();
    }


    /**
     * Get Active Pieces On The Board With Filter
     * @param {string} type Type of pieces to get
     * @param {string} color Color of pieces to get
     * @returns {(Array<Piece>|null)}
     */
    static getActivePiecesWithFilter(type, color) {
        let pieces = [];
        for (let square in gl_squares) {
            let piece = GameEngine.getPieceBySquareID(parseInt(square));
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
     * Is Square Has Piece ? if not then false else "friend" or "enemy"
     * @param {int} square_id Square ID of the target square
     * @returns {(boolean|string)}
     */
    static isSquareHas(square_id) {
        if (gl_squares[square_id] != 0) {
            if (GameEngine.getPieceBySquareID(square_id).color != gl_current_move)
                return "enemy";
            else
                return "friend";
        } else
            return false;
    }


    /**
     * Change Squares
     * @param {int} from Square ID of the piece to move
     * @param {int} to Square ID of the target square
     * @returns {void}
     */
    static movePieceToSquare(from, to) {
        let moved_piece = GameEngine.getPieceBySquareID(from);
        GameEngine.setGlobalSquare(from, 0);
        GameEngine.setGlobalSquare(to, moved_piece);
    }
}
