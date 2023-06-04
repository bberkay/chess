class Validation{
    /**
     * @constructor
     * @param {any} value Value to be validated
     * @param {ValidationType} target_type Target type of the value
     * @param {string} error_title Error title
     */
    constructor(value, target_type, error_title){
        this.value = value;
        this.target_type = target_type;
        this.error_title = error_title;
    }
}