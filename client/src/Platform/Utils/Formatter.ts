/**
 * Class to handle the formatting of strings.
 */
export class Formatter{
    /**
     * Convert the camel case string to title case.
     * @example camelCaseToTitleCase("camelCase") => "Camel Case"
     */
    public static camelCaseToTitleCase(str: string): string {
        return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
    }

    /**
     * Convert the camel case string to pascal case.
     * @example camelCaseToPascalCase("camelCase") => "CamelCase"
     */
    public static camelCaseToPascalCase(str: string): string {
        return (str.charAt(0).toUpperCase() + str.slice(1)).trim();
    }

    /**
     * Convert the pascal case string to camel case.
     * @example pascalCaseToCamelCase("PascalCase") => "pascalCase"
     */
    public static pascalCaseToCamelCase(str: string): string {
        return (str.charAt(0).toLowerCase() + str.slice(1)).trim();
    }

    /**
     * Convert the pascal case string to title case.
     * @example pascalCaseToTitleCase("PascalCase") => "Pascal Case"
     */
    public static pascalCaseToTitleCase(str: string): string {
        return str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
    }

    /**
     * Convert the title case string to pascal case.
     * @example titleCaseToCamelCase("Title Case") => "TitleCase"
     * @example titleCaseToCamelCase("title Case") => "TitleCase"
     */
    public static titleCaseToPascalCase(str: string): string {
        return (str.charAt(0).toUpperCase() + str.slice(1).replace(/\s/g, "")).trim();
    }

    /**
     * Convert the title case string to camel case.
     * @example titleCaseToCamelCase("Title Case") => "titleCase"
     * @example titleCaseToCamelCase("title Case") => "titleCase"
     */
    public static titleCaseToCamelCase(str: string): string {
        return (str.charAt(0).toLowerCase() + str.slice(1).replace(/\s/g, "")).trim();
    }
}