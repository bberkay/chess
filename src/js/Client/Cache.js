class Cache{
    static _cache = {};
    
    /**
     * Add a value to the cache
     * @returns {any}
     */
    static add(key, value){
        this._cache[key] = value;
    }

    /**
     * Get a value from the cache
     * @param {string} key
     * @returns {any}
     */
    static get(key){
        return this._cache[key];
    }

    /**
     * Clear the cache
     * @returns {void}
     */
    static clear(){
        this._cache = {};
    }
}