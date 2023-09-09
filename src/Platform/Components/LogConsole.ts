/**
 * This class provide a menu to show the logs.
 */
export class LogConsole{
    /**
     * Constructor of the LogConsole class.
     */
    constructor() {
        // Load css file of the chess board.
        this._loadCSS();

        // Create the table.
        this.createConsole();
    }

    /**
     * This function loads the css file of the log console.
     */
    private _loadCSS(): void
    {
        // Check if the css file is already loaded.
        if(document.getElementById("log-console-css"))
            return;

        // Create the link element and set the attributes.
        let link: HTMLLinkElement = document.createElement("link");
        link.id = "log-console-css";
        link.rel = "stylesheet";
        link.href = "./src/Platform/Components/Assets/css/log-console.css";

        // Add the link element to the head of the document.
        document.head.appendChild(link);
    }

    /**
     * This function creates the log console.
     */
    private createConsole(): void
    {
        // Create the form element.
        document.getElementById("log-console")!.innerHTML =
            `
            <div id="log-console-body">
                <ul id = "log-list">
                    
                </ul>
            </div>
            <div id="log-console-footer">
                <div id="log-console-footer-btn">
                    <button>Clear</button>
                </div>
                <div id="log-console-footer-content">
                    <span id = "log-file"></span>
                </div>
            </div>
            `;
    }
}