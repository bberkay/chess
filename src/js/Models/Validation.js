class Validation{
    /**
     * @constructor
     * @param {any} value Value to be validated
     * @param {ValidationType} target_type Target type of the value
     * @param {string} fail_msg Message to be shown if validation fails
     */
    constructor(value, target_type, fail_msg){
        this.value = value;
        this.target_type = target_type;
        this.fail_msg = msg;
    }
}