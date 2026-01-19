// Ambient module declaration to allow importing CSS files (with or without bindings)
declare module "*.css" {
    const classes: { [key: string]: string };
    export default classes;
}

// Explicit path for the global stylesheet so Next.js side-effect import is typed
declare module "./app/globals.css" {
    const classes: { [key: string]: string };
    export default classes;
}

declare module "./globals.css" {
    const classes: { [key: string]: string };
    export default classes;
}

// Anime.js global type declaration
declare global {
    interface Window {
        anime: any;
    }
}

export { };
