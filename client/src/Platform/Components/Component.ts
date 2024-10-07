import { PlatformEvent } from "@Platform/Types";

/**
 * Component abstract class. All components must inherit from this class.
 */
export abstract class Component{
    protected abstract renderComponent(): void;

    /**
     * This function loads the css file of the component.
     * @param {string} filename The name of the css file.
     */
    protected loadCSS(filename: string): void
    {
        const fileId = filename.replace(".", "-");

        if(!filename.endsWith(".css"))
            throw new Error("The filename must end with .css");

        if(!document.getElementById(`${fileId}`)){
            let link: HTMLLinkElement = document.createElement("link");
            link.id = fileId;
            link.rel = "stylesheet";
            link.href = `./css/components/${filename}`;
            document.head.appendChild(link);
        }
    }

    /**
     * This function creates the html of the component.
     */
    protected loadHTML(componentId: string, html: string): void
    {
        const component = document.getElementById(componentId);
        if(!component)
            throw new Error(`${componentId} element is not initialized. Please add it to the html file.`);

        component.innerHTML = html;
        this.createTooltips(componentId);
        this.createValidations(componentId);
        this.createCopyToClipboard(componentId);
        this.createSelectableButtons(componentId);
        document.dispatchEvent(new CustomEvent(PlatformEvent.onOperationMounted, {detail: {selector: "#" + componentId}}));
    }
    
    /**
     * Create tooltips of the component by data-tooltip-text 
     * attribute.
     */
    private createTooltips(componentId: string): void
    {
        const component = document.getElementById(componentId);
        if(!component) return;

        // A quite unsettling way to wait for the component's corrent(last) width to 
        // be calculated before checking if the text fits in the parent element.
        setTimeout(() => {
            for(const menuItem of component.querySelectorAll("[data-tooltip-text]")){
                const tooltipText = menuItem.getAttribute("data-tooltip-text");
                if(!tooltipText) continue;
                
                const shortenedParent = menuItem.getAttribute("data-shortened-parent");
                const shortenedLength = parseInt(menuItem.getAttribute("data-shortened-length") || "0");
                if(shortenedParent && shortenedLength > 0 && menuItem.textContent){
                    const parentElementWidth = menuItem.closest(shortenedParent)?.clientWidth || 0;
                    const textWidth = menuItem.getBoundingClientRect().width;
                    if(textWidth + shortenedLength > parentElementWidth){
                        menuItem.textContent = menuItem.textContent.slice(0, shortenedLength) + "...";
                    } else {
                        continue;
                    }
                }
                
                const tooltipElement = document.createElement("div");
                tooltipElement.classList.add("tooltip");
                menuItem.append(tooltipElement);
    
                let tooltipTimeout: number | Timer | undefined;
                menuItem.addEventListener("mouseover", function() {
                    tooltipTimeout = setTimeout(() => {
                        tooltipElement.classList.add("active");
                        tooltipElement.textContent = tooltipText;
                    }, 500);
                });
    
                menuItem.addEventListener("mouseout", function() {
                    clearTimeout(tooltipTimeout);
                    tooltipElement.classList.remove("active");
                    tooltipElement.textContent = "";
                });
    
                menuItem.addEventListener("mousedown", function(e) {
                    e.preventDefault();
                    clearTimeout(tooltipTimeout);
                    tooltipElement.classList.remove("active");
                    tooltipElement.textContent = "";
                });            
            }
        }, 100);
    }

    /**
     * This function creates the validations of the component.
     */
    private createValidations(componentId: string): void
    {
        const component = document.getElementById(componentId);
        if(!component) return;
        function isValid(input: HTMLInputElement): boolean
        {
            if(input.hasAttribute("required") && input.value === "")
                return false;

            if(input.hasAttribute("minlength") && input.value.length < parseInt(input.getAttribute("minlength")!))
                return false;

            if(input.hasAttribute("maxlength") && input.value.length > parseInt(input.getAttribute("maxlength")!))
                return false;

            return true;
        }

        const submitButton = component.querySelector("button[type='submit']");
        if(!submitButton) return;

        let allValid = false;
        const inputs = component.querySelectorAll("input");
        
        /**
         * Check all inputs if they are valid.
         */
        const checkInputs = () => {
            for(const input of inputs){
                if(!isValid(input)){
                    allValid = false;
                    break;
                }
                allValid = true;
            }
            
            if(allValid) submitButton.removeAttribute("disabled");
            else submitButton.setAttribute("disabled", "true");
        }

        // Check inputs on load.
        checkInputs();

        // Add event listener to check every input.
        inputs.forEach((input: HTMLInputElement) => {
            if(!input) return;
            input.addEventListener("input", () => {
                checkInputs();
            });
        });
    }

    /**
     * Create copy to clipboard functionality of the component.
     */
    private createCopyToClipboard(componentId: string): void
    {
        const component = document.getElementById(componentId);
        if(!component) return;
        for(const copyButton of component.querySelectorAll("[data-clipboard-text]")){
            if(!(copyButton instanceof HTMLButtonElement)) continue;
            copyButton.addEventListener("click", function() {
                const input = copyButton.parentElement!.querySelector(
                    "#" + copyButton.getAttribute("data-clipboard-text")!
                ) as HTMLInputElement;
                if(!input || !input.value) return;

                copyButton.textContent = "Copied!";
                input.select();
                navigator.clipboard.writeText(input.value);
            });
        }
    }

    /**
     * Create selectable buttons of the component.
     */
    private createSelectableButtons(componentId: string): void
    {
        const component = document.getElementById(componentId);
        if(!component) return;

        const buttons = component.querySelectorAll(`button[data-selected="false"]`) as NodeListOf<HTMLButtonElement>;
        if(!buttons || buttons.length === 0) return;

        const submitButton = component.querySelector("button[type='submit']");
        if(submitButton) submitButton?.setAttribute("disabled", "true");

        buttons.forEach((button: HTMLButtonElement) => {
            button.addEventListener("click", () => {
                if(submitButton) submitButton?.removeAttribute("disabled");
                
                const selectedButton = document.querySelector("button[data-selected='true']");
                if(selectedButton) selectedButton.setAttribute("data-selected", "false");

                button.setAttribute("data-selected", "true");
            });
        });
    }
}
