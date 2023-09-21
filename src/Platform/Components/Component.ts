/**
 * Component abstract class. All components must inherit from this class.
 */
export abstract class Component{
    abstract render(): void;
    abstract clear(): void;

    /**
     * This function loads the css file of the component.
     * @param {string} filename The name of the css file.
     * @param {string} fileId The id of the link element. If it is empty, the filename will
     * be used by replacing the dot with dash. For example: game-creator.css -> game-creator-css
     */
    protected loadCSS(filename: string, fileId: string = ""): void
    {
        // Check if the fileID is empty.
        if(fileId === "")
            fileId = filename.replace(".", "-");

        // Check if the css file is already loaded.
        if(document.getElementById(`${fileId}`))
            throw new Error(`${filename} file is already loaded.`);

        // Check the file is css file.
        if(!filename.endsWith(".css"))
            throw new Error("The filename must end with .css");

        // Create the link element and set the attributes.
        let link: HTMLLinkElement = document.createElement("link");
        link.id = fileId;
        link.rel = "stylesheet";
        link.href = `./src/Platform/Components/Assets/css/${filename}`;

        // Add the link element to the head of the document.
        document.head.appendChild(link);
    }

    /**
     * This function creates the html of the component.
     */
    protected loadHTML(componentId: string, html: string): void
    {
        // Check if the component id is found.
        if(!document.getElementById(componentId))
            throw new Error(`${componentId} element is not initialized. Please add it to the html file.`);

        document.getElementById(componentId)!.innerHTML = html;
    }
}