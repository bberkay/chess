import { Color, PieceType, Square, StartPosition, JsonNotation, CastlingType, CastlingStatus } from "../Types";

/**
 * This class is used to convert data from one type to another.
 */
export class Converter{
    /**
     * Convert squareID to square
     * @example Converter.convertSquareIDToSquare(57), return "a1"
     * @example Converter.convertSquareIDToSquare(8), return "h8"
     * @see For more information see Square Enum in src/Types.ts
     */
    static convertSquareIDToSquare(squareID: number): string
    {
        let square: string = "";

        let file = squareID % 8;
        let rank = Math.floor(squareID / 8);

        // 97 is the char code of "a" and file + 96 because the file starts from 1
        square += String.fromCharCode(file + 96);

        // 8 - rank because the rank starts from 8
        square += (8 - rank).toString();

        return square;
    }

    /**
     * Convert FEN to JSON
     * @example Converter.convertFENToJSON("8/8/8/8/8/8/P7/8 w - - 0 1")
     * @see For more information about fen notation https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
     * @see For more information about Json notation etc. check src/Types.ts
     */
    static convertFenToJson(fenNotation: StartPosition | string): JsonNotation
    {
        // Split fen notation by space
        const splitFen = fenNotation.split(" ");

        /**
         * Find castling availability from the fen notation
         */
        const castlingAvailability: CastlingStatus = {
            [CastlingType.WhiteLong] : splitFen[2].includes("Q"),
            [CastlingType.WhiteShort] : splitFen[2].includes("K"),
            [CastlingType.BlackLong] : splitFen[2].includes("q"),
            [CastlingType.BlackShort] : splitFen[2].includes("k")
        }

        // Json notation
        let jsonNotation: JsonNotation = {
            board:[],
            turn: splitFen[1] === "w" ? Color.White : Color.Black,
            castling: castlingAvailability,
            enPassant: splitFen[3].includes("-") ? null : Square[splitFen[3] as keyof typeof Square],
            halfMoveClock: parseInt(splitFen[4]),
            fullMoveNumber: parseInt(splitFen[5])
        };

        /**
         * Type scheme (first letter of the piece type except for the knight) for convert letter to the piece type
         * @see For more information please see above wikipedia page
         */
        const typeScheme:Record<string, PieceType> = {
            "n":PieceType.Knight,
            "b":PieceType.Bishop,
            "p":PieceType.Pawn,
            "r":PieceType.Rook,
            "k":PieceType.King,
            "q":PieceType.Queen
        };

        // Rows of the board (first part of the FEN, for example "8/8/8/8/8/8/P7/8")
        const rows: string[] = splitFen[0].split("/");

        // Loop through the fen board
        for(let i:number = 0; i < 8; i++) {

            // Get current row of fen notation
            const currentRow: string = rows[i]; // 8 or P7 of the "8/8/8/8/8/8/P7/8"

            /**
             * Calculate row and column counter, for change to the json notation.
             * Row is 8 - i, because current for loop starts from 0 and fen notation starts from 8
             * Column is 0, because this is the starting point, we'll change this below.
             * @see For more information please see the wikipedia link in the description of the function.
             */
            const jsonRow: number = 8 - i;
            let jsonColumn: string = String.fromCharCode(64 + (i + 1)); // i + 1 because the column starts from 1
            let columnCounter: number = 0;


            // Loop through the current row
            for (let j:number = 0; j < currentRow.length; j++)
            {
                // Find current square from the current row, can be 8 or P7
                let square: string = currentRow[j];

                if (parseInt(square)) // If square is a number(is 8 or 7)
                {
                    /**
                     * Add square to column counter for change squareID to square
                     * and find current column by column counter.
                     * @see For more information see Square Enum in src/Types.ts
                     */
                    columnCounter += parseInt(square);
                    jsonColumn = String.fromCharCode(columnCounter);
                }
                else // If square is a letter
                {
                    /**
                     * Add 1 to column counter for change squareID to square(means set next square)
                     * and find current column by column counter, for example if columnCounter is 52(d2)
                     * then do 53(e2) by add 1 to columnCounter.
                     * @see For more information see Square Enum in src/Types.ts
                     */
                    columnCounter += 1;
                    jsonColumn = String.fromCharCode(64 + columnCounter).toString().toLowerCase();

                    /**
                     * If square is a letter, that means square has piece then
                     * add piece to json notation
                     */
                    jsonNotation.board.push({
                        color: square == square.toLowerCase() ? Color.Black : Color.White, // If square is lowercase, piece is black, otherwise piece is white
                        type: typeScheme[square.toLowerCase()], // Convert the letter to the piece type
                        square: Square[(jsonColumn + jsonRow.toString()) as keyof typeof Square]  // Convert the column and row to the square
                    });
                }
            }
        }

        return jsonNotation;
    }

    /**
     * Convert JSON to FEN
     * @see For more information about fen notation https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
     */
    static convertJsonToFen(jsonNotation: JsonNotation): string
    {
        /**
         * Is char a numeric?
         */
        function isNumeric(c: string): boolean
        {
            return c >= "0" && c <= "9";
        }

        /**
         * Default fen notation, 8 rows and 8 columns and all of them are empty
         * @see For more information please see above wikipedia page
         */
        let fenNotation: Array<number|string> = [8, 8, 8, 8, 8, 8, 8, 8];

        /**
         * Type scheme (first letter of the piece type except for the knight) for convert piece type to the fen notation
         * @see For more information please see above wikipedia page
         */
        const typeScheme: Record<PieceType, string> = {
            [PieceType.Knight]: "n",
            [PieceType.Bishop]: "b",
            [PieceType.Pawn]: "p",
            [PieceType.Rook]: "r",
            [PieceType.King]: "k",
            [PieceType.Queen]: "q"
        };

        /**
         * Board for convert json notation to the fen notation.
         * Initialize the board with 8 rows and 8 columns and fill it with 1, means empty.
         * This board is a bridge between json notation and fen notation. Why we need this?
         * Because if convert json notation to the fen notation directly then our algorithm will be
         * big-o(n^3) but if we use this bridge then we can reduce(but we will use more space) it to big-o(n^2).
         *
         * Bridge: {8:[1, 1, 1, 1, 1, 1, 1, 1], 7:[1, 1, 1, 1, 1, 1, 1, 1], ..., 1:[1, 1, 1, 1, 1, 1, 1, 1]}
         */
        let jsonToFenBridgeBoard:Record<number, Array<number|string>> = {};

        for(let i = 0; i<8; i++)
        {
            jsonToFenBridgeBoard[i+1] = [1, 1, 1, 1, 1, 1, 1, 1];
        }

        // Loop through the jsonNotation
        for(let i in jsonNotation)
        {
            // Current piece
            let piece: {color:Color, type:PieceType, square:Square} = jsonNotation.board[Number(i)];

            // Convert squareID to square
            let square: string = Converter.convertSquareIDToSquare(piece["square"]);

            // Type of the piece
            let type: string = typeScheme[piece["type"]];

            /**
             * Convert square to the place, for example if square is a1 then square.charCodeAt(0) is 97
             * and 'a'.charCodeAt(0) is 97 then 97 - 97 = 0, means place is 0 or if square is b1 then
             * square.charCodeAt(0) is 98 and 'a'.charCodeAt(0) is 97 then 98 - 97 = 1, means place is 1
             */
            let place: number = square.charCodeAt(0) - 'a'.charCodeAt(0);

            /**
             * If piece is black then convert type to lowercase, otherwise convert type to uppercase(fen notation)
             * and set the piece to the board by place and row.
             * @see For more information about fen notation please see above wikipedia page
             */
            const row: number = parseInt(square.charAt(1));
            jsonToFenBridgeBoard[row][place] = piece["color"] == Color.Black ? type.toLowerCase() : type.toUpperCase();
        }

        // Row counter for fen notation. Example, every "/" of (8/8/8/8/8/8/8/8)
        let fenRowCounter: number = 0;

        // Loop through the board
        for(let i= 8; i>0; i--) // We start from 8 to 0 because fen notation starts from 8th row
        {
            // Current row of the board
            let row: Array<number|string> = jsonToFenBridgeBoard[i];

            /**
             * Fen string initialize for current row. We will increment this string
             * with the square or number.
             */
            let fenRow: string = "0";

            // Loop through the row
            for(let t = 0; t<8; t++)
            {
                // Current square of the row (square can be number or letter)
                let square: number|string = row[t];

                // If square is number then increment fenString with square
                if(isNumeric(square.toString()))
                {
                    /**
                     * Get last char of the fenRow and add 1 to it then add it to the fenRow again.
                     * For example, if fenString is "7" then last char is "7" and "7" + 1 is "8" or
                     * if fenString is "p1" then last char is "1" and "1" + 1 is "2" then add it to
                     * the fenString again, so fenString is "p2".
                     */
                    fenRow = fenRow.slice(0, -1);
                    fenRow += (parseInt(square.toString()) + 1).toString();
                }
                else
                {
                    /**
                     * If square is not number then add it to the fenRow directly. For example,
                     * if fenString is "7" then last char is "7" and "7" + "p" is "7p" or if
                     * fenString is "k1" then last char is "1" and "1" + "p" is "1p" then add it to
                     * the fenString again, so fenString is "k1p".
                     */
                    fenRow += square;
                }
            }

            // Set fenRow to the fenNotation array and increment fenRowCounter by 1 for next row
            // Also replace 0(initialize value) with empty string because fen notation does not have 0
            fenNotation[fenRowCounter] = fenRow.replace("0", "");
            fenRowCounter++;
        }

        /**
         * Get turn, castling, en passant, half move clock and full move number from the json notation
         * and convert them to the fen notation.
         */
        const turn: string = jsonNotation.turn == Color.White ? "w" : "b";
        const castling: string = (jsonNotation.castling.WhiteShort ? "K" : "") +
            (jsonNotation.castling.WhiteLong ? "Q" : "") +
            (jsonNotation.castling.BlackShort ? "k" : "") +
            (jsonNotation.castling.BlackLong ? "q" : "");
        const enPassant: string =  jsonNotation.enPassant == null ? "-" : Converter.convertSquareIDToSquare(jsonNotation.enPassant);

        // Return fen notation as string with space between them
        return fenNotation.join("/") + " " + turn + " " + castling + " " + enPassant + " " + jsonNotation.halfMoveClock.toString() + " " + jsonNotation.fullMoveNumber.toString();
    }
}