class Piece {
    // Private properties
    #color;
    #type;
    #moveCount;
    #startPosition;
    #moveEngine;
    #id;

    /**
     * Create Piece Object
     * @param {string} type 
     * @param {string} color 
     * @param {int} square 
     * @param {int|null} id
     */
    constructor(type, color, square, id = null) {
        this.#type = type;
        this.#color = color;
        this.#moveCount = 0;
        this.#startPosition = square;
        this.#moveEngine = new MoveEngine();
        this.#id = !id ? this.#moveEngine.createPieceId() : id;

        // Set Target Square Content to this piece
        Global.setSquare(square, this);
    }

    /**
     * @public
     * Get Playable Squares
     * @returns {Array<int>}
     */
    getPlayableSquares() {
        return this.#moveEngine.getPlayableSquaresOfPiece(this.#type, this.getSquareId());
    }
    
    /**
     * @public
     * Get Square ID of Piece
     * @returns {int} 
     */
    getSquareId() {
        for (let k in Global.getSquares()) {
            if (Global.getSquare(parseInt(k)) === this)
                return parseInt(k);
        }
    }

    /**
     * @public
     * Increase move count of Piece
     * @returns {void}
     */
    increaseMoveCount() {
        this.#moveCount++;
    }

    /**
     * @public
     * Get Move Count of Piece
     * @returns {int}
     */
    get moveCount() {
        return this.#moveCount;
    }

    /**
     * @public
     * Get Start Position of Piece
     * @returns {int}
     */
    get startPosition() {
        return this.#startPosition;
    }

    /**
     * @public
     * Get Type of Piece
     * @returns {string}
     */
    get type() {
        return this.#type;
    }

    /**
     * @public
     * Get Color of Piece
     * @returns {string}
     */
    get color() {
        return this.#color;
    }

    /**
     * @public
     * Get ID of Piece
     * @returns {int}
     */
    get id() {
        return this.#id;
    }
}