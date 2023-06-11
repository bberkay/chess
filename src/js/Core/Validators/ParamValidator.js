class ParamValidator{
    /**
     * @static
     * Validate square
     * @param {int} square_id
     * @param {(Piece|int)} square_content optional
     * @param {boolean} can_empty Can be empty? optional, default is true
     * @throw Error
     */
    static validateSquare({square_id=null, square_content=null, can_empty=true}){
        if(!square_id && !square_content)
            throw new Error('At least one of square_id or square_content must be given');

        if(typeof square_id !== "number")
            throw new Error("Square ID must be integer");

        if(square_id < 1 || square_id > 64)
            throw new Error("Square ID must be between 1 and 64");

        if(square_content){
            if(can_empty && square_content instanceof Piece == false && square_content != 0)
                throw new Error("Piece must be instance of Piece object or 0");

            if(can_empty == false && square_content instanceof Piece == false)
                throw new Error("Piece must be instance of Piece object");
        }
    }

    /**
     * @static
     * Validate piece
     * @param {Piece} piece optional
     * @param {Color} color optional
     * @param {int} id is id in id_list, optional
     * @throw Error
     */
    static validatePiece({piece=null, color=null, id=null}){
        if(!piece && !color && !id)
            throw new Error('At least one of piece, color or id must be given');

        if(piece)
            this.validateSquareContent(piece, false);

        if(color && piece.color != color)
            throw new Error(`Piece color must be '${color}'`);

        if(id && !Global.getIdList().includes(id))
            throw new Error('Piece id is not in id list');
    }

    /**
     * @static
     * Validate Type
     * @param {int|boolean|string} value
     * @param {Validation} target_type
     * @param {string} msg
     * @throw Error
     */
    static #validateValueByType(value, target_type, msg){
        if(typeof value != target_type)
            throw new Error(`'${msg}' is not a '${target_type}'`);
    }


    /**
     * @static
     * Validate Enum
     * @param {int} value
     * @param {Enum} enum_obj
     * @param {string} msg
     * @throw Error
     */
    static #validateValueByEnum(value, enum_obj, msg){
        if(Object.values(enum_obj).includes(value) == false)
            throw new Error(`Value is not a '${msg}' enum`);
    }

    /**
     * @static
     * Validate value
     * @param {Array<Validation>} validations
     * @throw Error
     */
    static validateTypes(validations){
        for(let validation in validations){
            if(validation.target_type instanceof Object)
                this.#validateValueByEnum(validation.value, validation.target_type, validation.error_title);
            else
                this.#validateValueByType(validation.value, validation.target_type, validation.error_title);
        }
    }   
}