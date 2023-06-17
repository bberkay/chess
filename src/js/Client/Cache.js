class Cache{
    static #cache = {};

    /**
     * Set a value in the cache
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    static set(key, value){
        this.#cache[key] = value;
    }

    /**
     * Get a value from the cache
     * @param {string} key
     * @returns {any}
     */
    static get(key = null){
        if(key == null)
            return this.#cache;
        else
            return this.#cache[key];
    }

    /**
     * Clear the cache
     * @returns {void}
     */
    static clear(key = null){
        if(key)
            delete this.#cache[key];
        else
            this.#cache = {};
    }

    /**
     * Add a value to the cache
     * @returns {void}
     */
    static add(key, value){
        if(!this.#cache[key])
            this.#cache[key] = [];

        this.#cache[key].push(value);
    }

    /**
     * Check if a key exists in the cache
     * @param {string} key
     * @returns {boolean}
     */
    static has(key){
        return this.#cache[key] != undefined;
    }
}