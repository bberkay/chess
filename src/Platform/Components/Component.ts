/**
 * Component abstract class. All components must inherit from this class.
 */
export abstract class Component{
    protected abstract renderComponent(): void;

    /**
     * This function loads the css file of the component.
     * @param {string} filename The name of the css file.
     * @param {string} fileId The id of the link element. If it is empty, the filename will
     * be used by replacing the dot with dash. For example: game-creator.css -> game-creator-css
     */
    protected loadCSS(filename: string, fileId: string = ""): void
    {
        if(fileId === "")
            fileId = filename.replace(".", "-");

        if(document.getElementById(`${fileId}`))
            throw new Error(`${filename} file is already loaded.`);

        if(!filename.endsWith(".css"))
            throw new Error("The filename must end with .css");

        let link: HTMLLinkElement = document.createElement("link");
        link.id = fileId;
        link.rel = "stylesheet";
        link.href = `./css/components/${filename}`;
        document.head.appendChild(link);
    }

    /**
     * This function creates the html of the component.
     */
    protected loadHTML(componentId: string, html: string): void
    {
        if(!document.getElementById(componentId))
            throw new Error(`${componentId} element is not initialized. Please add it to the html file.`);

        document.getElementById(componentId)!.innerHTML = html;
    }
}
