// Type declarations for the React Bits StaggeredMenu vendor component (StaggeredMenu.jsx).
// Keep in sync with the default values in the .jsx implementation.
import type { ComponentType } from "react";

export type StaggeredMenuItem = {
  label: string;
  ariaLabel?: string;
  link: string;
};

export type StaggeredMenuSocialItem = {
  label: string;
  link: string;
};

export type StaggeredMenuProps = {
  position?: "left" | "right";
  /** Pre-layer sweep colors, drawn back-to-front behind the panel */
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  closeOnClickAway?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
};

export declare const StaggeredMenu: ComponentType<StaggeredMenuProps>;
declare const _default: ComponentType<StaggeredMenuProps>;
export default _default;
