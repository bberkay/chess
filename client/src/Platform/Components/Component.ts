import { s } from "vitest/dist/reporters-cb94c88b.js";

/**
 * Component abstract class. All components must inherit from this class.
 */
export abstract class Component{
    protected abstract renderComponent(): void;

    /**
     * This function loads the css file of the component.
     * @param {string} filename The name of the css file.
     * @param {string} fileId The id of the link element. If it is empty, the filename will
     * be used by replacing the dot with dash. For example: board-editor.css -> board-editor-css
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

        this.createTooltips(document.getElementById(componentId)!);
        this.createValidations(document.getElementById(componentId)!);

        const observer = new MutationObserver(() => {
            const component = document.getElementById(componentId);
            if(!component) return;
            this.createTooltips(component);
            this.createValidations(component);
            this.createCopyToClipboard(component);
            this.createSelectableButtons(component);
        });
        observer.observe(document.getElementById(componentId)!, { childList: true });
    }

    /**
     * Create tooltips of the component by data-tooltip-text 
     * attribute.
     */
    private createTooltips(component: HTMLElement): void
    {
        if(!component) return;
        for(const menuItem of component.querySelectorAll("[data-tooltip-text]")){
            const tooltipText = menuItem.getAttribute("data-tooltip-text");
            if(!tooltipText) continue;

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
    }

    /**
     * This function creates the validations of the component.
     */
    private createValidations(component: HTMLElement): void
    {
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

        submitButton.setAttribute("disabled", "true");
        component.querySelectorAll("input").forEach((input: HTMLInputElement) => {
            input.addEventListener("input", () => {
                if(isValid(input)) submitButton.removeAttribute("disabled");
                else submitButton.setAttribute("disabled", "true");
            });
        });
    }

    /**
     * Create copy to clipboard functionality of the component.
     */
    private createCopyToClipboard(component: HTMLElement): void
    {
        if(!component) return;
        for(const copyButton of component.querySelectorAll("[data-clipboard-text]")){
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
    private createSelectableButtons(component: HTMLElement): void {
        if(!component) return;
        const buttons = component.querySelectorAll(`${component.id} button[data-selected]`) as NodeListOf<HTMLButtonElement>;
        const submitButton = component.querySelector("button[type='submit']");
        if(submitButton) submitButton?.setAttribute("disabled", "true");
        buttons.forEach((button: HTMLButtonElement) => {
            button.addEventListener("click", () => {
                if(submitButton) submitButton?.removeAttribute("disabled");
                const selectedButton = document.querySelector("button[data-selected='true']");
                if(selectedButton) selectedButton.setAttribute("data-selected", "false");
                button.setAttribute("data-selected", "true");
                button.setAttribute("data-selected", "false");
            });
        });
    }
}
