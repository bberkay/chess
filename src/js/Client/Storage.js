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
	 * @param {string} key 
	 * @returns {any}
	 */
	static get(key){
		return this.#storage[key];
	}
}