// Type declarations for the React Bits DecryptedText vendor component (DecryptedText.jsx).
// Keep in sync with the default values in the .jsx implementation.
import type { ComponentType, HTMLAttributes } from "react";

export type DecryptedTextProps = {
  text: string;
  /** Interval between scramble iterations, in ms */
  speed?: number;
  /** Max scramble iterations per character (non-sequential mode) */
  maxIterations?: number;
  /** Reveal characters one by one instead of all at once */
  sequential?: boolean;
  revealDirection?: "start" | "end" | "center";
  /** Scramble using only characters present in the original text */
  useOriginalCharsOnly?: boolean;
  /** Character pool used for scrambling */
  characters?: string;
  /** Class applied to revealed characters */
  className?: string;
  /** Class applied to the wrapping span */
  parentClassName?: string;
  /** Class applied to still-encrypted characters */
  encryptedClassName?: string;
  animateOn?: "hover" | "view" | "click" | "inViewHover";
  clickMode?: "once" | "toggle";
} & Omit<HTMLAttributes<HTMLSpanElement>, "className">;

declare const DecryptedText: ComponentType<DecryptedTextProps>;
export default DecryptedText;
