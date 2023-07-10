class Cache{
    /**
     * Set a value in the cache
     * @param {CacheLayer} layer
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    static set(layer, key, value){
        let layer_data = JSON.parse(localStorage.getItem(layer));

        // If layer is empty then create it
        if(layer_data == null){
            localStorage.setItem(layer, JSON.stringify({}));
            layer_data = {};
        }

        layer_data[key] = value;
        localStorage.setItem(layer, JSON.stringify(layer_data));
    }

    /**
     * Get a value from the cache
     * @param {CacheLayer} layer
     * @param {string|null} key
     * @returns {any}
     */
    static get(layer, key=null){
        if(key && Cache.has(layer, key))
            return JSON.parse(localStorage.getItem(layer))[key];
        else if(key == null)
            return JSON.parse(localStorage.getItem(layer));
        return null;
    }

    /**
     * Clear the cache
     * @param {CacheLayer} layer
     * @returns {void}
     */
    static clear(layer){
        localStorage.setItem(layer, JSON.stringify({}));
    }

    /**
     * Clear the cache
     * @param {CacheLayer} layer
     * @param {string} key Key that will be removed from the cache
     * @returns {void}
     */
    static remove(layer, key){
        let layer_data = localStorage.getItem(layer);
        delete layer_data[key];
        localStorage.setItem(layer, layer_data);
    }

    /**
     * Add a value in the cache
     * @param {CacheLayer} layer
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    static add(layer, key, value){
        if(!Cache.has(layer, key))
            Cache.set(layer, key, value);
        else{
            let key_data = Cache.get(layer, key);

            if(Array.isArray(key_data)) // If key_data is an array then push the value
                key_data.push(value);
            else if(typeof key_data !== "object") // If key_data is not an object then create an array
                key_data = [key_data, value];
            else // If key_data is an object then add the value
                key_data[Object.keys(value)[0]] = Object.values(value)[0];

            Cache.set(layer, key, key_data);
        }
    }

    /**
     * Check if a key exists in the cache
     * @param {CacheLayer} layer
     * @param {string} key
     * @returns {boolean}
     */
    static has(layer, key){
        let layer_data = JSON.parse(localStorage.getItem(layer));
        return layer_data && key in layer_data;
    }
}