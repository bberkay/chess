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
     * @param {string} key
     * @returns {any}
     */
    static get(layer, key){
        if(Cache.has(layer, key))
            return JSON.parse(localStorage.getItem(layer))[key];
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
        let layer_data = JSON.parse(localStorage.getItem(layer));
        let item = Cache.get(layer, key);

        // If item is array then push value to the array
        if(Array.isArray(value)){
            if(item == null)
                item = []

            item.push(value)
        }
        // If item is json then set value to the key
        else if(typeof value == "object"){
            if(item == null)
                item = {};

            item[Object.keys(value)[0]] = Object.values(value)[0];
        }

        layer_data[key] = {[key]: item};
        localStorage.setItem(layer, JSON.stringify(layer_data));
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