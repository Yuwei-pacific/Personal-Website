// Specific module declaration so side-effect imports resolve under bundler moduleResolution
declare module "./globals.css" {
    const styles: { [className: string]: string };
    export default styles;
}

declare const styles: { [className: string]: string };
export default styles;
