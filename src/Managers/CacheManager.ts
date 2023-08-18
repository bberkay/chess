import { CacheLayer } from "@types";

/**
 * This static class provides a way to store data in a layered way in local storage.
 */
export class CacheManager {
    /**
     * Stores the data in the local storage.
     * @example Cache.set(CacheLayer.Game, "checkedPlayer", "white");
     * @example Cache.set(CacheLayer.Game, "pieceIds", [1111, 1212]);
     * @example Cache.set(CacheLayer.Game, "moves", {1111: ["d5"]});
     */
    static set(layer: CacheLayer, key: string, value: any): void
    {
        let layerData: object = CacheManager.get(layer) || {};

        // If the layer is not created yet, create it. Otherwise, add the new data to the layer.
        localStorage.setItem(layer, JSON.stringify({...layerData, [key]: value}));
    }

    /**
     * Returns the data from the local storage.
     * @example Cache.get(CacheLayer.Game, "checkedPlayer");
     */
    static get(layer: CacheLayer, key: string|null = null): any
    {
        let layerData: Record<string, any> = JSON.parse(localStorage.getItem(layer) as string);

        // If key is null, return the whole layer data. Otherwise, return the data of the key if it exists.
        if(!key)
            return layerData;

        return layerData.hasOwnProperty(key) ? layerData[key] : null;
    }

    /**
     * Removes the data from the local storage.
     * @example Cache.remove(CacheLayer.Game, "checkedPlayer");
     */
    static remove(layer: CacheLayer, key: string): void
    {
        let layerData: any = CacheManager.get(layer);

        // If the data is null, there is no data to remove.
        if(!layerData)
            return;

        // If the data is not null, remove the data from the layer and update the layer.
        delete layerData[key];
        localStorage.setItem(layer, JSON.stringify(layerData));
    }

    /**
     * Add variable to data in the local storage.
     * @example Cache.add(CacheLayer.Game, "pieceIds", 1212); // [1111] -> [1111, 1212]
     * @example Cache.add(CacheLayer.Game, "moves", {1212: ["a1", "a2"]}); // {1111: ["d5"]} -> {1111: ["d5"], 1212: ["a1", "a2"]}
     * @example Cache.add(CacheLayer.Game, "pieceIds", [1212, 1313]); // [1111] -> [1111, 1212, 1313]
     * @example Cache.add(CacheLayer.Game, "moves", {1111: ["a1", "a2"]}); // {1111: ["d5"]} -> {1111: ["d5", "a1", "a2"]}
     */
    static add(layer: CacheLayer, key: string, value: any): void
    {
        let layerData: any = CacheManager.get(layer, key) || {};

        /**
         * If layer data is array and value is not array, push the value to the array.
         * If layer data and value are object/json then merge them.
         * If layer data and value are array, concat them.
         * Otherwise, throw an error.
         */
        if(Array.isArray(layerData) && !Array.isArray(value)){
            /**
             * If layer data is array and value is not array, push the value to the array.
             * This is first example in the function description.
             */
            layerData.push(value);
        }
        else if(layerData instanceof Object && value instanceof Object){
            for(let key in value){
                if(layerData.hasOwnProperty(key)){
                    /**
                     * If key is exist in the layer data, merge the values.
                     * This if fourth example in the function description.
                     */
                    layerData[key] = layerData[key].concat(value[key]);
                }
                else{
                    /**
                     * If key is not exist in the layer data, add the key and value.
                     * This is second example in the function description.
                     */
                    layerData[key] = value[key];
                }
            }
        }
        else if(Array.isArray(layerData) && Array.isArray(value)){
            /**
             * If layer data and value are array, concat them.
             * This is third example in the function description.
             */
            layerData = layerData.concat(value);
        }
        else{
            throw new Error("CacheManager.add() function does not support this type of data.");
        }

        // Update the layer.
        CacheManager.set(layer, key, layerData);
    }

    /**
     * Clear layer
     */
    static clear(layer: CacheLayer): void
    {
        localStorage.setItem(layer, JSON.stringify({}));
    }
}