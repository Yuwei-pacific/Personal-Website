// Type declarations for the vendored React Bits Masonry component (Masonry.jsx).
// Keep in sync with the default values and site adaptations in the .jsx implementation.
import type { ComponentType } from "react";

export type MasonryItem = {
  id: string;
  /** Image URL rendered as background-image */
  img: string;
  /** Natural (or design) height. With `width` set, cell height = columnWidth * height / width */
  height: number;
  /** Natural width; enables true-aspect-ratio cells (site adaptation) */
  width?: number;
  /** Accessible label for the item button (site adaptation) */
  alt?: string;
  /** Fallback click target when no onItemClick is provided (upstream behavior) */
  url?: string;
};

export type MasonryProps = {
  items: MasonryItem[];
  /** GSAP easing for relayout animations */
  ease?: string;
  /** Relayout animation duration in seconds */
  duration?: number;
  /** Entrance delay between items in seconds */
  stagger?: number;
  animateFrom?: "top" | "bottom" | "left" | "right" | "center" | "random";
  scaleOnHover?: boolean;
  hoverScale?: number;
  /** Animate from blurred to focused on initial load */
  blurToFocus?: boolean;
  /** Gradient overlay on hover */
  colorShiftOnHover?: boolean;
  /** Site adaptation: handle item clicks (e.g. open a lightbox) instead of window.open(item.url) */
  onItemClick?: (item: MasonryItem, index: number) => void;
};

declare const Masonry: ComponentType<MasonryProps>;
export default Masonry;
