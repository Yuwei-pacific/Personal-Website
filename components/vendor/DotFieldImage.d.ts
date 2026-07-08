// Type declarations for the DotFieldImage vendor component (DotFieldImage.jsx),
// an image-sampling extension of the React Bits DotField canvas background.
// Keep in sync with the default values in the .jsx implementation.
import type { ComponentType, CSSProperties } from "react";

export type DotFieldImageProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  /** Fallback gradient used when no imageSrc is given or before the image loads */
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  /** Source image: each dot samples the pixel color at its position */
  imageSrc?: string;
  imageFit?: "contain" | "cover";
  /** Color for dots on transparent / uncovered areas of the image */
  fallbackColor?: string;
  className?: string;
  style?: CSSProperties;
};

declare const DotFieldImage: ComponentType<DotFieldImageProps>;
export default DotFieldImage;
