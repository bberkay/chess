class Storage{
	static #storage = {};

	/**
	 * @static 
	 * Add a key-value pair to storage
	 * @param {string} key 
	 * @param {any} value 
	 * @returns {void}
	 */
	static set(key, value){
		this.#storage[key] = value;
	}

	/**
	 * @static
	 * Get a value from storage
	 * @param {string|null} key
	 * @returns {any}
	 */
	static get(key=null){
		return key ? this.#storage[key] : this.#storage;
	}

	/**
	 * @static
	 * Remove a key-value pair from storage
	 * @param {string} key
	 * @returns {void}
	 */
	static remove(key){
		delete this.#storage[key];
	}

	/**
	 * @static
	 * Clear storage
	 * @returns {void}
	 */
	static clear(){
		this.#storage = {};
	}
}