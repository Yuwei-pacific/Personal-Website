"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { gsap } from "@/lib/animation/gsap";

import "./staggered-menu.css";

export type StaggeredMenuItem = {
  label: string;
  ariaLabel?: string;
  link: string;
};

export type StaggeredMenuSocialItem = {
  label: string;
  link: string;
};

type StaggeredMenuProps = {
  items: StaggeredMenuItem[];
  socialItems: StaggeredMenuSocialItem[];
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  onItemClick?: (href: string, event: ReactMouseEvent<HTMLAnchorElement>) => void;
};

type PanelElements = {
  itemEls: HTMLElement[];
  numberEls: HTMLElement[];
  socialTitle: HTMLElement | null;
  socialLinks: HTMLElement[];
};

const PRE_LAYER_COLORS = ["#dbe4ee", "#171717"];
const MENU_BUTTON_COLOR = "#ffffff";
const OPEN_MENU_BUTTON_COLOR = "#171717";
const OFFSCREEN_X = 100;

const getPanelElements = (panel: HTMLElement): PanelElements => ({
  itemEls: Array.from(panel.querySelectorAll<HTMLElement>(".sm-panel-itemLabel")),
  numberEls: Array.from(
    panel.querySelectorAll<HTMLElement>(".sm-panel-list[data-numbering] .sm-panel-item")
  ),
  socialTitle: panel.querySelector<HTMLElement>(".sm-socials-title"),
  socialLinks: Array.from(panel.querySelectorAll<HTMLElement>(".sm-socials-link")),
});

const resetPanelContent = ({
  itemEls,
  numberEls,
  socialTitle,
  socialLinks,
}: PanelElements) => {
  if (itemEls.length) {
    gsap.set(itemEls, { yPercent: 140, rotate: 10 });
  }
  if (numberEls.length) {
    gsap.set(numberEls, { "--sm-num-opacity": 0 });
  }
  if (socialTitle) {
    gsap.set(socialTitle, { opacity: 0 });
  }
  if (socialLinks.length) {
    gsap.set(socialLinks, { y: 25, opacity: 0 });
  }
};

function StaggeredMenu({
  items,
  socialItems,
  onMenuOpen,
  onMenuClose,
  onItemClick,
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const [textLines, setTextLines] = useState(["Menu", "Close"]);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLDivElement[]>([]);
  const plusHRef = useRef<HTMLSpanElement>(null);
  const plusVRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      const preLayers = preContainer ? Array.from(preContainer.querySelectorAll<HTMLDivElement>(".sm-prelayer")) : [];
      preLayerElsRef.current = preLayers;

      gsap.set([panel, ...preLayers], { xPercent: OFFSCREEN_X, opacity: 1 });

      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }

      gsap.set(plusH, { transformOrigin: "50% 50%", rotate: 0 });
      gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      gsap.set(textInner, { yPercent: 0 });

      if (toggleBtnRef.current) {
        gsap.set(toggleBtnRef.current, { color: MENU_BUTTON_COLOR });
      }
    });

    return () => context.revert();
  }, []);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;

    const panelElements = getPanelElements(panel);
    const { itemEls, numberEls, socialTitle, socialLinks } = panelElements;
    const layerStates = layers.map((element) => ({ element, start: OFFSCREEN_X }));
    resetPanelContent(panelElements);

    const timeline = gsap.timeline({ paused: true });

    layerStates.forEach(({ element, start }, index) => {
      timeline.fromTo(element, { xPercent: start }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, index * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    timeline.fromTo(
      panel,
      { xPercent: OFFSCREEN_X },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStart = panelInsertTime + panelDuration * 0.15;

      timeline.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: "power4.out",
          stagger: { each: 0.1, from: "start" },
        },
        itemsStart
      );

      if (numberEls.length) {
        timeline.to(
          numberEls,
          {
            duration: 0.6,
            ease: "power2.out",
            "--sm-num-opacity": 1,
            stagger: { each: 0.08, from: "start" },
          },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;

      if (socialTitle) {
        timeline.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.5,
            ease: "power2.out",
          },
          socialsStart
        );
      }

      if (socialLinks.length) {
        timeline.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: { each: 0.08, from: "start" },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: "opacity" });
            },
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = timeline;
    return timeline;
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;

    busyRef.current = true;
    const timeline = buildOpenTimeline();

    if (timeline) {
      timeline.eventCallback("onComplete", () => {
        busyRef.current = false;
      });
      timeline.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();

    closeTweenRef.current = gsap.to(all, {
      xPercent: OFFSCREEN_X,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        resetPanelContent(getPanelElements(panel));
        busyRef.current = false;
      },
    });
  }, []);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    if (!icon) return;

    spinTweenRef.current?.kill();
    spinTweenRef.current = gsap.to(icon, {
      rotate: opening ? 225 : 0,
      duration: opening ? 0.8 : 0.35,
      ease: opening ? "power4.out" : "power3.inOut",
      overwrite: "auto",
    });
  }, []);

  const animateColor = useCallback((opening: boolean) => {
    const button = toggleBtnRef.current;
    if (!button) return;

    colorTweenRef.current?.kill();
    colorTweenRef.current = gsap.to(button, {
      color: opening ? OPEN_MENU_BUTTON_COLOR : MENU_BUTTON_COLOR,
      delay: 0.18,
      duration: 0.3,
      ease: "power2.out",
    });
  }, []);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;

    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? "Menu" : "Close";
    const targetLabel = opening ? "Close" : "Menu";
    const sequence = [currentLabel];
    let last = currentLabel;

    for (let index = 0; index < 3; index += 1) {
      last = last === "Menu" ? "Close" : "Menu";
      sequence.push(last);
    }

    if (last !== targetLabel) {
      sequence.push(targetLabel);
    }
    sequence.push(targetLabel);
    setTextLines(sequence);

    gsap.set(inner, { yPercent: 0 });
    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -(((sequence.length - 1) / sequence.length) * 100),
      duration: 0.5 + sequence.length * 0.07,
      ease: "power4.out",
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
      toggleBtnRef.current?.focus();
    }

    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [animateColor, animateIcon, animateText, onMenuClose, onMenuOpen, playClose, playOpen]);

  const closeMenu = useCallback(() => {
    if (!openRef.current) return;

    openRef.current = false;
    setOpen(false);
    onMenuClose?.();
    playClose();
    animateIcon(false);
    animateColor(false);
    animateText(false);
    toggleBtnRef.current?.focus();
  }, [animateColor, animateIcon, animateText, onMenuClose, playClose]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;

      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        return;
      }

      if (event.key !== "Tab") return;

      const panelFocusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
      const focusable = [toggleBtnRef.current, ...panelFocusable].filter((element): element is HTMLElement => Boolean(element));
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeMenu, open]);

  const handleItemClick = (item: StaggeredMenuItem, event: ReactMouseEvent<HTMLAnchorElement>) => {
    onItemClick?.(item.link, event);
    closeMenu();
  };

  return (
    <div className="staggered-menu-wrapper" data-open={open ? "true" : undefined}>
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {PRE_LAYER_COLORS.map((color, index) => (
          <div key={`${color}-${index}`} className="sm-prelayer" style={{ background: color }} />
        ))}
      </div>

      <header className="staggered-menu-header" aria-label="Main navigation header">
        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="staggered-menu-panel"
          onClick={toggleMenu}
          type="button"
        >
          <span className="sm-toggle-textWrap" aria-hidden="true">
            <span ref={textInnerRef} className="sm-toggle-textInner">
              {textLines.map((line, index) => (
                <span className="sm-toggle-line" key={`${line}-${index}`}>
                  {line}
                </span>
              ))}
            </span>
          </span>
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span ref={plusHRef} className="sm-icon-line" />
            <span ref={plusVRef} className="sm-icon-line sm-icon-line-v" />
          </span>
        </button>
      </header>

      <aside
        id="staggered-menu-panel"
        ref={panelRef}
        className="staggered-menu-panel"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="sm-panel-inner">
          <ul className="sm-panel-list" role="list" data-numbering="true">
            {items.length ? (
              items.map((item, index) => (
                <li className="sm-panel-itemWrap" key={`${item.label}-${index}`}>
                  <a
                    className="sm-panel-item"
                    href={item.link}
                    aria-label={item.ariaLabel}
                    data-index={index + 1}
                    onClick={(event) => handleItemClick(item, event)}
                  >
                    <span className="sm-panel-itemLabel">{item.label}</span>
                  </a>
                </li>
              ))
            ) : (
              <li className="sm-panel-itemWrap" aria-hidden="true">
                <span className="sm-panel-item">
                  <span className="sm-panel-itemLabel">No items</span>
                </span>
              </li>
            )}
          </ul>

          {socialItems.length > 0 && (
            <div className="sm-socials" aria-label="Social links">
              <h3 className="sm-socials-title">Socials</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="sm-socials-item">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default StaggeredMenu;
