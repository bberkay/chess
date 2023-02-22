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