// Ambient module declaration to allow importing CSS files (with or without bindings)
declare module "*.css" {
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
