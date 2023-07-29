class Converter{
    /**
     * This class is used to convert data from one type to another.
     */

    /**
     * Convert JSON Path to ArrayList Path
     * @example input is {"top":[3,4,5], "bottom":[8,9,10]} and output is [3,4,5,8,9,10]
     */
    static convertJSONPathToArrayPath(jsonPath: {MoveRoute:Array<number>}): Array<number>
    {
        let arrayPath: Array<number> = [];

        for(let i in jsonPath){
            arrayPath = arrayPath.concat(jsonPath[i as keyof typeof jsonPath]);
        }

        return arrayPath;
    }

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
     * Convert FEN to JSON
     * @example input is "8/8/8/8/8/8/P7/8 w - - 0 1" and output is {"color": Color.White, "piece": PieceType.Pawn, "position": Square.a2}
     */
    static convertFENToJSON(fen: string): Array<{color:Color, piece:PieceType, square:Square}>
    {
        let jsonBoard:Array<{color:Color, piece:PieceType, square:Square}> = [];

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
        const rows: string[] = fen.split(" ")[0].split("/");

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
                    jsonBoard.push({
                        color: square == square.toLowerCase() ? Color.Black : Color.White, // If square is lowercase, it is black, otherwise it is white
                        piece: PieceType[typeScheme[square.toLowerCase()] as keyof typeof PieceType], // Convert the letter to the piece type
                        square: Square[(currentColumn.toString() + currentRow.toString()) as keyof typeof Square] // Convert the column and row to the square
                    });
                }
            }
        }

        return jsonBoard;
    }

    /**
     * Convert JSON to FEN
     * @example input is {"color": Color.White, "piece": PieceType.Pawn, "position": Square.a2} and output is "8/8/8/8/8/8/P7/8 w - - 0 1"
     */
    static convertJSONToFEN(json: JSON): string
    {
        // TODO: Burası yapılacak.
    }
}