import { MenuOperation, PlatformEvent } from "@Platform/Types";

/**
 * The delay time to show the tooltip.
 */
const TOOLTIP_SHOW_DELAY_MS = 500;

/**
 * Component abstract class. All components must inherit from this class.
 */
export abstract class Component {
    public abstract readonly id: string;

    /**
     * Render the component's html.
     */
    protected abstract renderComponent(...args: unknown[]): void;

    /**
     * Handle the operation of the component.
     * @param operation The operation to be handled.
     */
    public abstract handleOperation(
        operation: MenuOperation,
        menuItem: HTMLElement | null
    ): void;

    /**
     * This function loads the css file of the component.
     * @param {string} filename The name of the css file.
     */
    protected loadCSS(filename: string): void {
        const fileId = filename.replace(".", "-");

        if (!filename.endsWith(".css"))
            throw new Error("The filename must end with .css");

        if (!document.getElementById(`${fileId}`)) {
            const link: HTMLLinkElement = document.createElement("link");
            link.id = fileId;
            link.rel = "stylesheet";
            link.href = `./css/components/${filename}`;
            document.head.appendChild(link);
        }
    }

    /**
     * This function creates the html of the component.
     */
    protected loadHTML(componentId: string, html: string): void {
        const component = document.getElementById(componentId);
        if (!component)
            throw new Error(
                `${componentId} element is not initialized. Please add it to the html file.`
            );

        component.innerHTML = html;
        this.createTooltipsIfThereAre(componentId);
        this.createValidationsIfThereAre(componentId);
        this.createCopyToClipboardIfThereAre(componentId);
        this.createSelectableButtonsIfThereAre(componentId);
        this.createDropdownsIfThereAre(componentId);
        this.createSwitchesIfThereAre(componentId);
        document.dispatchEvent(
            new CustomEvent(PlatformEvent.onOperationMounted, {
                detail: { selector: "#" + componentId },
            })
        );
    }

    /**
     * Create tooltips of the component by data-tooltip-text
     * attribute.
     */
    private createTooltipsIfThereAre(componentId: string): void {
        const component = document.getElementById(componentId);
        if (!component) return;

        // A quite unsettling way to wait for the component's corrent(last) width to
        // be calculated before checking if the text fits in the parent element.
        setTimeout(() => {
            for (const menuItem of component.querySelectorAll(
                "[data-tooltip-text]"
            )) {
                const tooltipText = menuItem.getAttribute("data-tooltip-text");
                if (!tooltipText) continue;

                const shortenedParent = menuItem.getAttribute(
                    "data-shortened-parent"
                );
                const shortenedLength = parseInt(
                    menuItem.getAttribute("data-shortened-length") || "0"
                );
                if (
                    shortenedParent &&
                    shortenedLength > 0 &&
                    menuItem.textContent
                ) {
                    const parentElementWidth =
                        menuItem.closest(shortenedParent)?.clientWidth || 0;
                    const textWidth = menuItem.getBoundingClientRect().width;
                    if (textWidth + shortenedLength > parentElementWidth) {
                        menuItem.textContent =
                            menuItem.textContent.slice(0, shortenedLength) +
                            "...";
                    } else {
                        continue;
                    }
                }

                const tooltipElement = document.createElement("div");
                tooltipElement.classList.add("tooltip");
                menuItem.append(tooltipElement);

                let tooltipTimeout: number | Timer | undefined;
                menuItem.addEventListener("mouseover", function () {
                    tooltipTimeout = setTimeout(() => {
                        tooltipElement.classList.add("active");
                        tooltipElement.textContent = tooltipText;
                    }, TOOLTIP_SHOW_DELAY_MS);
                });

                menuItem.addEventListener("mouseout", function () {
                    clearTimeout(tooltipTimeout);
                    tooltipElement.classList.remove("active");
                    tooltipElement.textContent = "";
                });

                menuItem.addEventListener("mousedown", function (e) {
                    e.preventDefault();
                    clearTimeout(tooltipTimeout);
                    tooltipElement.classList.remove("active");
                    tooltipElement.textContent = "";
                });
            }
        }, 50);
    }

    /**
     * This function creates the validations of the component.
     */
    private createValidationsIfThereAre(componentId: string): void {
        const component = document.getElementById(componentId);
        if (!component) return;

        /**
         * Check if the input is valid.
         * If the input is required then it must have a value.
         * If the input has a minlength attribute then the value must
         * be longer than the minlength.
         * If the input has a maxlength attribute then the value must
         * be shorter than the maxlength.
         * If the input is number it should be a number.
         */
        function isValid(input: HTMLInputElement): boolean {
            if (input.hasAttribute("required") && input.value === "")
                return false;

            if (
                input.hasAttribute("minlength") &&
                input.value.length < parseInt(input.getAttribute("minlength")!)
            )
                return false;

            if (
                input.hasAttribute("maxlength") &&
                input.value.length > parseInt(input.getAttribute("maxlength")!)
            )
                return false;

            if (
                input.hasAttribute("type") &&
                input.getAttribute("type") === "number" &&
                isNaN(parseInt(input.value))
            )
                return false;

            return true;
        }

        /**
         * Prevent non-numeric input for number inputs.
         */
        function preventNonNumericInput(event: KeyboardEvent): void {
            if (event.ctrlKey || event.altKey || event.metaKey) {
                return;
            }

            // Allow only numbers, backspace, delete, tab, and arrow keys
            const charCode = event.which ? event.which : event.keyCode;
            if (
                (charCode < 48 || charCode > 57) &&
                charCode !== 8 &&
                charCode !== 9 &&
                (charCode < 37 || charCode > 40)
            ) {
                event.preventDefault();
            }
        }

        const submitButton = component.querySelector("button[type='submit']");
        if (!submitButton) return;

        const inputs = component.querySelectorAll("input");

        // Check inputs on load.
        const inputArray = Array.from(inputs);
        if (inputArray.every((input) => isValid(input))) {
            submitButton.removeAttribute("disabled");
        } else {
            submitButton.setAttribute("disabled", "true");
        }

        // Add event listener to check every input.
        inputs.forEach((input: HTMLInputElement) => {
            if (!input) return;

            const isNumber = input.getAttribute("type") === "number";
            input.addEventListener("keydown", (e) => {
                if (isNumber) preventNonNumericInput(e);
            });

            input.addEventListener("input", () => {
                if (inputArray.every((input) => isValid(input))) {
                    submitButton.removeAttribute("disabled");
                } else {
                    submitButton.setAttribute("disabled", "true");
                }
            });
        });
    }

    /**
     * Create copy to clipboard functionality of the component.
     */
    private createCopyToClipboardIfThereAre(componentId: string): void {
        const component = document.getElementById(componentId);
        if (!component) return;
        for (const copyButton of component.querySelectorAll(
            "[data-clipboard-text]"
        )) {
            if (!(copyButton instanceof HTMLButtonElement)) continue;
            copyButton.addEventListener("click", function () {
                const input = copyButton.parentElement!.querySelector(
                    "#" + copyButton.getAttribute("data-clipboard-text")!
                ) as HTMLInputElement;
                if (!input || !input.value) return;

                copyButton.textContent = "Copied!";
                input.select();
                navigator.clipboard.writeText(input.value);
            });
        }
    }

    /**
     * Add functionality to selectable buttons.
     */
    private createSelectableButtonsIfThereAre(componentId: string): void {
        const component = document.getElementById(componentId);
        if (!component) return;

        const buttons = component.querySelectorAll(
            `button[data-selected="false"]`
        ) as NodeListOf<HTMLButtonElement>;
        if (!buttons || buttons.length === 0) return;

        const submitButton = component.querySelector("button[type='submit']");
        if (submitButton) submitButton?.setAttribute("disabled", "true");

        buttons.forEach((button: HTMLButtonElement) => {
            button.addEventListener("click", () => {
                if (submitButton) submitButton?.removeAttribute("disabled");

                const selectedButton = document.querySelector(
                    "button[data-selected='true']"
                );
                if (selectedButton)
                    selectedButton.setAttribute("data-selected", "false");

                button.setAttribute("data-selected", "true");
            });
        });
    }

    /**
     * Add functionality to dropdowns.
     */
    private createDropdownsIfThereAre(componentId: string): void {
        const component = document.getElementById(componentId);
        if (!component) return;

        const dropdowns = component.querySelectorAll(".dropdown");
        if (!dropdowns || dropdowns.length === 0) return;

        for (const dropdown of dropdowns) {
            const dropdownButton = dropdown.querySelector(".dropdown-button");
            if (!dropdownButton) return;

            const dropdownContent = dropdown.querySelector(".dropdown-content");
            if (!dropdownContent) return;

            dropdownButton.addEventListener("click", () => {
                dropdownContent.classList.toggle("active");
            });

            window.addEventListener("click", (e) => {
                if (!dropdown.contains(e.target as Node)) {
                    dropdownContent.classList.remove("active");
                }
            });

            const dropdownItems = dropdownContent.querySelectorAll(
                ".dropdown-item"
            ) as NodeListOf<HTMLElement>;
            if (!dropdownItems || dropdownItems.length === 0) return;

            dropdownItems.forEach((item: HTMLElement) => {
                item.addEventListener("click", () => {
                    const prevSelectedItem = dropdownContent.querySelector(
                        ".dropdown-item.selected"
                    );
                    if (prevSelectedItem)
                        prevSelectedItem.classList.remove("selected");
                    item.classList.add("selected");
                    dropdownButton.querySelector(
                        ".dropdown-title"
                    )!.textContent = item.textContent;
                    dropdownContent.classList.remove("active");
                });
            });

            /*const dropdownTitle = dropdown.querySelector(".dropdown-title") as HTMLElement;
            const observer = new MutationObserver(() => {
                const selectedItems = dropdownContent.querySelectorAll(".dropdown-item.selected");
                if(selectedItems.length > 0){
                    dropdownTitle.textContent = selectedItems[0].textContent;
                }
            });

            observer.observe(dropdownContent, {attributes: true, attributeFilter: ["class"]});*/
        }
    }

    /**
     * Add functionality to switches.
     */
    private createSwitchesIfThereAre(componentId: string): void {
        const component = document.getElementById(componentId);
        if (!component) return;

        const switches = component.querySelectorAll(".switch");
        if (!switches || switches.length === 0) return;

        for (const switchElement of switches) {
            const input = switchElement.querySelector("input");
            if (!input) return;

            const slider = switchElement.querySelector(".slider");
            if (!slider) return;

            input.addEventListener("change", () => {
                if (input.checked) {
                    input.setAttribute("checked", "true");
                } else {
                    input.removeAttribute("checked");
                }
            });
        }
    }
}
