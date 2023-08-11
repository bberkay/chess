export class CacheManager {
    /**
     * This static class provides a way to store data in a layered way in local storage.
     */

    /**
     * Stores the data in the local storage.
     * @example Cache.set(CacheLayer.Game, "checked_player", "white");
     */
    static set(layer: CacheLayer, key: string, value: any): void
    {
        let layerData: object = CacheManager.get(layer) || {};

        // If the layer is not created yet, create it. Otherwise, add the new data to the layer.
        localStorage.setItem(layer, JSON.stringify({...layerData, [key]: value}));
    }

    /**
     * Returns the data from the local storage.
     * @example Cache.get(CacheLayer.Game, "checked_player");
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
     * @example Cache.remove(CacheLayer.Game, "checked_player");
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
     * @example Cache.add(CacheLayer.Game, "zugzwang_squares", "a2"); // zugzwang_squares = ["a1"] -> zugzwang_squares = ["a1", "a2"]
     * @example Cache.add(CacheLayer.Game, "moves", {1212: ["a1", "a2"]}); // moves = {1111: ["d5"]} -> moves = {1111: ["d5"], 1212: ["a1", "a2"]}
     */
    static add(layer: CacheLayer, key: string, value: any){
        let layerData: any = CacheManager.get(layer, key) || {};

        // Find the type of the layer data and add the value to the layer data.
        if(Array.isArray(layerData)) // If layer data is array, push the value to the array.
            layerData.push(value);
        else if(typeof layerData !== "object") // If layer data is not array or object, create an array and push the value to the array.
            layerData = [layerData, value];
        else // If layer data is object, add the value to the object.
            layerData = { ...layerData, ...value };

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