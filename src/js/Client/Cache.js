class Cache{
    /**
     * Set a value in the cache
     * @param {string} key
     * @param {any} value
     * @returns {void}
     */
    static set(key, value){
        localStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * Get a value from the cache
     * @param {string} key
     * @returns {any}
     */
    static get(key){
        return JSON.parse(localStorage.getItem(key));
    }

    /**
     * Clear the cache
     * @param {string} key Key that will be removed from the cache
     * @returns {void}
     */
    static clear(key=null){
        if(key == null)
            localStorage.clear();
        else
            localStorage.removeItem(key);
    }

    /**
     * Add a value in the cache
     * @param {string} key 
     * @param {any} value
     * @returns {void}
     */
    static add(key, value){
        let item = JSON.parse(localStorage.getItem(key));

        // If item is array then push value to the array
        if(value.length){
            if(item == null)
                item = []

            item.push(value);
        }
        // If item is json then set value to the key
        else{
            if(item == null)
                item = {};

            item[Object.keys(value)[0]] = Object.values(value)[0];
        }

        localStorage.setItem(key, JSON.stringify(item));
    }

    /**
     * Check if a key exists in the cache
     * @param {string} key
     * @returns {boolean}
     */
    static has(key){
        return localStorage.getItem(key) != undefined;
    }

    /**
     * Find a value in the list
     * @param {string} list_name
     * @param {string} value
     * @returns {any|boolean} If value is found then return value, else return false
     */
    static find(list_name, value){
        let item = JSON.parse(localStorage.getItem(list_name));

        if(item != null){         
            for(let i = 0; i < item.length; i++)
                if(value in item[i])
                    return item[i][value];
   
        }

        return false;
    }
}