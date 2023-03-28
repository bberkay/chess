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
var gl_id_list = []; // Pieces ID

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

/*
 * Input Enums
 */

/**
 * @enum {number} 
 */
const Square = {
    a1: 57,
    a2: 49,
    a3: 41,
    a4: 33,
    a5: 25,
    a6: 17,
    a7: 9,
    a8: 1,
    b1: 58,
    b2: 50,
    b3: 42,
    b4: 34,
    b5: 26,
    b6: 18,
    b7: 10,
    b8: 2,
    c1: 59,
    c2: 51,
    c3: 43,
    c4: 35,
    c5: 27,
    c6: 19,
    c7: 11,
    c8: 3,
    d1: 60,
    d2: 52,
    d3: 44,
    d4: 36,
    d5: 28,
    d6: 20,
    d7: 12,
    d8: 4,
    e1: 61,
    e2: 53,
    e3: 45,
    e4: 37,
    e5: 29,
    e6: 21,
    e7: 13,
    e8: 5,
    f1: 62,
    f2: 54,
    f3: 46,
    f4: 38,
    f5: 30,
    f6: 22,
    f7: 14,
    f8: 6,
    g1: 63,
    g2: 55,
    g3: 47,
    g4: 39,
    g5: 31,
    g6: 23,
    g7: 15,
    g8: 7,
    h1: 64,
    h2: 56,
    h3: 48,
    h4: 40,
    h5: 32,
    h6: 24,
    h7: 16,
    h8: 8,
}

/**
 * @enum {string}
 */
const Color = {
    white:"white",
    black:"black"
}

/**
 * @enum {string}
 */
const Type = {
    knight:"knight",
    queen:"queen",
    king:"king",
    bishop:"bishop",
    rook:"rook",
    pawn:"pawn",
}

