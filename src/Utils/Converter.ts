class Converter{
    /**
     * This class is used to convert data from one type to another.
     */

    /**
     * Convert square to squareID
     * @example input is "a1" and output is 57, input is "h8" and output is 8 (you can see the squareID table in the "../Enums.ts" file)
     */
    static convertSquareToSquareID(square:string): number
    {
        let squareID: number = 1;

        let file = square[0];
        let rank = square[1];

        squareID += (file.charCodeAt(0) - 97); // 97 is the char code of "a"
        squareID += (8 - parseInt(rank)) * 8; // 8 - parseInt(rank) because the rank starts from 8

        return squareID;
    }

    /**
     * Convert squareID to square
     * @example input is 57 and output is "a1", input is 8 and output is "h8" (you can see the squareID table in the "../Enums.ts" file)
     */
    static convertSquareIDToSquare(squareID:number): string
    {
        let square: string = "";

        let file = squareID % 8;
        let rank = Math.floor(squareID / 8);

        square += String.fromCharCode(file + 97); // 97 is the char code of "a"
        square += (8 - rank).toString(); // 8 - rank because the rank starts from 8

        return square;
    }

    /**
     * Convert FEN to JSON
     * @example input is "8/8/8/8/8/8/P7/8 w - - 0 1" and output is {"color": Color.White, "type": PieceType.Pawn, "square": Square.a2}
     */
    static convertFENToJSON(fenNotation: string): Array<{color:Color, type:PieceType, square:Square}>
    {
        let jsonNotation:Array<{color:Color, type:PieceType, square:Square}> = [];

        // Schemes
        const typeScheme:Record<string, string> = {
            "n":"Knight",
            "b":"Bishop",
            "p":"Pawn",
            "r":"Rook",
            "k":"King",
            "q":"Queen"
        };

        const columnScheme:Record<number, string> = {
            1:"a",
            2:"b",
            3:"c",
            4:"d",
            5:"e",
            6:"f",
            7:"g",
            8:"h"
        };

        // Rows of the board (first part of the FEN)
        const rows: string[] = fenNotation.split(" ")[0].split("/");

        // Delete rows that are empty(8 is empty)
        rows.splice(rows.indexOf("8"), 1);

        for(let i:number = 0; i < 8; i++) {
            // Current row and column
            const row: string = rows[i];
            const currentRow: number = 8 - i; // 8 - i because the row starts from 8
            let currentColumn: string = columnScheme[i + 1]; // i + 1 because the column starts from 1
            let columnCounter: number = 0; // This is used to calculate the column

            // Loop through the row
            for (let j:number = 0; j < row.length; j++)
            {
                let square: string = row[j];
                if (parseInt(square)) // If square is a number
                {
                    columnCounter += parseInt(square);
                    currentColumn = columnScheme[columnCounter];
                }
                else // If square is a letter
                {
                    columnCounter += 1;
                    currentColumn = columnScheme[columnCounter];

                    // Push the square to the jsonBoard
                    jsonNotation.push({
                        color: square == square.toLowerCase() ? Color.Black : Color.White, // If square is lowercase, it is black, otherwise it is white
                        type: PieceType[typeScheme[square.toLowerCase()] as keyof typeof PieceType], // Convert the letter to the piece type
                        square: Square[(currentColumn.toString() + currentRow.toString()) as keyof typeof Square] // Convert the column and row to the square
                    });
                }
            }
        }

        return jsonNotation;
    }

    /**
     * Convert JSON to FEN
     * @example input is {"color": Color.White, "type": PieceType.Pawn, "square": Square.a2} and output is "8/8/8/8/8/8/P7/8 w - - 0 1"
     */
    static convertJSONToFEN(jsonNotation: Array<{color:Color, type:PieceType, square:Square}>): string
    {
        /**
         * Is char a numeric?
         */
        function isNumeric(c: string): boolean
        {
            return c >= "0" && c <= "9";
        }

        let fenNotation: Array<number|string> = [8, 8, 8, 8, 8, 8, 8, 8];
        let typeScheme: Record<string, string> = {
            "knight": "n",
            "bishop": "b",
            "pawn": "p",
            "rook": "r",
            "king": "k",
            "queen": "q"
        };

        // Initialize the board with 8 rows and 8 columns and fill it with 1
        let board:Record<number, Array<number|string>> = {};
        for(let i = 0; i<8; i++)
        {
            /*
                {8:[1, 1, 1, 1, 1, 1, 1, 1], 7..., 1:[1, 1, 1, ...]}
            */
            board[i+1] = [1, 1, 1, 1, 1, 1, 1, 1];
        }

        // Loop through the jsonNotation
        for(let i in jsonNotation)
        {
            let piece: {color:Color, type:PieceType, square:Square} = jsonNotation[i];
            let square: string = Converter.convertSquareIDToSquare(piece["square"]);
            let place: number = square.charCodeAt(0) - 'a'.charCodeAt(0);
            let type: string = typeScheme[piece["type"].toLowerCase()];
            board[parseInt(square.charAt(1))][place] = piece["color"] == Color.Black ? type.toLowerCase() : type.toUpperCase();
        }

        // Loop through the board
        let fenCounter: number = 0;
        for(let i= 8; i>0; i--)
        {
            // Current row
            let row: Array<number|string> = board[i];

            // Fen string of the row
            let fenString: string = "0";

            // Loop through the row
            for(let t = 0; t<8; t++)
            {
                let square: number|string = row[t];

                //
                if(isNumeric(square.toString()))
                {
                    fenString = fenString.slice(0, -1);
                    fenString += (parseInt(square.toString()) + 1).toString();
                }
                else
                {
                    fenString += square;
                }
            }

            fenNotation[fenCounter] = fenString.replace("0", "");
            fenCounter++;
        }

        return fenNotation.join("/");
    }

    /**
     * Convert JSON Path to ArrayList Path
     * @example input is {"top":[3,4,5], "bottom":[8,9,10]} and output is [3,4,5,8,9,10]
     */
    static convertJSONPathToArrayPath(jsonPath: {MoveRoute:Array<number>}): Array<number>
    {
        let arrayPath: Array<number> = [];

        for(let i in jsonPath)
        {
            arrayPath = arrayPath.concat(jsonPath[i as keyof typeof jsonPath]);
        }

        return arrayPath;
    }
}