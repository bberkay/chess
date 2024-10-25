import { Component } from "../Component";

/**
 * Navbar component abstract class. All navbar components
 * must inherit from this class.
 */
export abstract class NavbarComponent extends Component {
    /**
     * This function loads the css file of the navbar
     * component. The difference between NavbarComponent and
     * Component is that NavbarComponent adds the path
     * "navbar-components/" to the filename.
     * @param {string} filename The name of the css file.
     */
    protected loadCSS(filename: string): void {
        super.loadCSS("navbar-components/navbar-component.css");
        super.loadCSS("navbar-components/" + filename);
    }

    /**
     * This function creates the html of the navbar component.
     * The difference between NavbarComponent and Component is that
     * NavbarComponent adds the class "navbar-component" to the
     * componentId element.
     */
    protected loadHTML(componentId: string, html: string): void {
        super.loadHTML(componentId, html);
    }

    /**
     * Hide the navbar component.
     */
    public abstract hide(): void;

    /**
     * Show the navbar component.
     */
    public abstract show(): void;
}
