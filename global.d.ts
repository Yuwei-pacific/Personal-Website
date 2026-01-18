// Ambient module declaration to allow importing CSS files
declare module "*.css";

// Anime.js global type declaration
declare global {
    interface Window {
        anime: any;
    }
}

export { };
