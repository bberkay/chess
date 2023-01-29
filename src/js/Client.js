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
    Checked squares
    example:
    [
        44(Piece.id):[12, 34, 56](Array<int>) -> Controlled squares by Piece.id
        32(Piece.id):[45, 30, 12](Array<int>) -> Controlled squares by Piece.id
    ]
*/
var gl_checked_squares = {};

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


/**
 * Set Global Square
 * @param {int} key
 * @param {Piece|int} value
 * @returns {void}
 */
function setGlobalSquare(key, value) {
    gl_squares[key] = value;
}

/**
 * Set Global Piece
 * @param {int} id
 * @param {Piece} piece
 * @returns {void}
 */
function setGlobalPiece(id, piece) {
    gl_pieces[id] = piece;
}

/**
 * Create ID for Piece
 * @returns {int}
 */
function createPieceID() {
    const id = Math.floor(Math.random() * 101);
    if (!gl_pieces[id])
        return id;
    else
        createPieceID();
}


/**
 * Get Piece By Square ID
 * @param {int} square_id 
 * @returns {(Piece|boolean)} 
 */
function getPieceBySquareID(square_id) {
    return gl_squares[square_id] != 0 ? gl_squares[square_id] : false;
}


/**
 * Get Square ID By Piece
 * @param {Piece} piece 
 * @returns {(int|boolean)} 
 */
function getSquareIDByPiece(piece) {
    for(let k in gl_squares){
        if(gl_squares[k] == piece)
            return parseInt(k);
    }
    return false;
}


/**
 * Is Square Has Piece ? if not then false else "friend" or "enemy"
 * @param {int} square_id Square ID of the target square
 * @returns {(boolean|string)}
 */
function isSquareHas(square_id) {
    if (gl_squares[square_id] != 0) {
        if (getPieceBySquareID(square_id).color != gl_current_move)
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
function movePieceToSquare(from, to) {
    let moved_piece = getPieceBySquareID(from);
    setGlobalSquare(from, 0);
    setGlobalSquare(to, moved_piece);

    // set checked/controlled squares of moved piece
    setCheckedSquares(moved_piece);
}

/**
 * Is square in checked squares ?
 * @param {int} square_id Square ID for search
 * @returns {(boolean|int)} 
 */
function inCheckedSquares(square_id) {
    let find = false;
    for(let piece_id in gl_checked_squares){
        if(gl_pieces[piece_id].color != gl_current_move){
            gl_checked_squares[piece_id].forEach(checked_square => {
                if(checked_square == square_id)
                    find = square_id;
            });
        }
    }
    return find;
}

/**
 * Set checked/controlled squares
 * @param {Piece} piece
 * @returns {void}
 */
function setCheckedSquares(piece) {
    gl_checked_squares[piece.id] = piece.getPlayableSquares(true);
}
