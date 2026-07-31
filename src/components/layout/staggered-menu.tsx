"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useLenis } from "lenis/react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animation/gsap-react";
import {
  maskedTextHiddenVars,
  maskedTextRevealVars,
} from "@/lib/animation/masked-text-reveal";

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

export type StaggeredMenuLanguageItem = {
  label: string;
  link: string;
  ariaLabel: string;
  current: boolean;
};

type StaggeredMenuLabels = {
  menu: string;
  close: string;
  openMenu: string;
  closeMenu: string;
  headerAria: string;
  noItems: string;
  socials: string;
  socialLinksAria: string;
  language: string;
};

type StaggeredMenuProps = {
  items: StaggeredMenuItem[];
  socialItems: StaggeredMenuSocialItem[];
  languageItems: StaggeredMenuLanguageItem[];
  labels: StaggeredMenuLabels;
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
    gsap.set(itemEls, maskedTextHiddenVars());
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

// 「减弱动画」偏好下的面板内容终态：与打开时间线的最终值一致，只是瞬间到位
const revealPanelContent = ({
  itemEls,
  numberEls,
  socialTitle,
  socialLinks,
}: PanelElements) => {
  if (itemEls.length) {
    gsap.set(itemEls, { yPercent: 0, rotation: 0 });
  }
  if (numberEls.length) {
    gsap.set(numberEls, { "--sm-num-opacity": 1 });
  }
  if (socialTitle) {
    gsap.set(socialTitle, { opacity: 1 });
  }
  if (socialLinks.length) {
    gsap.set(socialLinks, { y: 0, opacity: 1 });
  }
};

function StaggeredMenu({
  items,
  socialItems,
  languageItems,
  labels,
  onMenuOpen,
  onMenuClose,
  onItemClick,
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const [textLines, setTextLines] = useState([labels.menu, labels.close]);
  // Lenis 未启用（减弱动画偏好 / Studio）时为 undefined，滚动锁会走原生回退
  const lenis = useLenis();
  const openRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const preLayersRef = useRef<HTMLDivElement>(null);
  const preLayerElsRef = useRef<HTMLDivElement[]>([]);
  const plusHRef = useRef<HTMLSpanElement>(null);
  const plusVRef = useRef<HTMLSpanElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const textInnerRef = useRef<HTMLSpanElement>(null);
  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTlRef = useRef<gsap.core.Timeline | null>(null);
  const spinTweenRef = useRef<gsap.core.Tween | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const playOpenRef = useRef<(() => void) | null>(null);
  const playCloseRef = useRef<(() => void) | null>(null);
  const animateIconRef = useRef<((opening: boolean) => void) | null>(null);
  const animateColorRef = useRef<((opening: boolean) => void) | null>(null);
  const animateTextRef = useRef<((opening: boolean) => void) | null>(null);

  useGSAP(
    (_context, contextSafe) => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;
      if (!panel || !plusH || !plusV || !icon || !textInner || !contextSafe) return;

      // 「减弱动画」偏好：所有开合动效改为瞬间到位（不改变任何最终状态），
      // 这是全站动画的统一约定 —— 这里是尺度最大的一处动效，尤其需要遵守
      const reduced = prefersReducedMotion();

      const preLayers = preContainer
        ? Array.from(preContainer.querySelectorAll<HTMLDivElement>(".sm-prelayer"))
        : [];
      preLayerElsRef.current = preLayers;

      gsap.set([panel, ...preLayers], { xPercent: OFFSCREEN_X, opacity: 1 });
      resetPanelContent(getPanelElements(panel));

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

      playOpenRef.current = contextSafe(() => {
        const currentPanel = panelRef.current;
        const layers = preLayerElsRef.current;
        if (!currentPanel) return;

        closeTlRef.current?.kill();
        closeTlRef.current = null;
        openTlRef.current?.kill();

        const panelElements = getPanelElements(currentPanel);
        const { itemEls, numberEls, socialTitle, socialLinks } = panelElements;

        if (reduced) {
          gsap.set([...layers, currentPanel], { xPercent: 0 });
          revealPanelContent(panelElements);
          openTlRef.current = null;
          return;
        }

        const timeline = gsap.timeline({ paused: true });

        layers.forEach((element, index) => {
          timeline.to(
            element,
            { xPercent: 0, duration: 0.5, ease: "power4.out" },
            index * 0.07
          );
        });

        const lastTime = layers.length ? (layers.length - 1) * 0.07 : 0;
        const panelInsertTime = lastTime + (layers.length ? 0.08 : 0);
        const panelDuration = 0.65;

        timeline.to(
          currentPanel,
          { xPercent: 0, duration: panelDuration, ease: "power4.out" },
          panelInsertTime
        );

        if (itemEls.length) {
          const itemsStart = panelInsertTime + panelDuration * 0.15;

          timeline.to(
            itemEls,
            maskedTextRevealVars(),
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
              },
              socialsStart + 0.04
            );
            const socialLinksEnd =
              socialsStart + 0.04 + 0.55 + Math.max(0, socialLinks.length - 1) * 0.08;
            timeline.set(socialLinks, { clearProps: "opacity" }, socialLinksEnd);
          }
        }

        openTlRef.current = timeline;
        timeline.play(0);
      });

      playCloseRef.current = contextSafe(() => {
        openTlRef.current?.kill();
        openTlRef.current = null;

        const currentPanel = panelRef.current;
        const layers = preLayerElsRef.current;
        if (!currentPanel) return;

        closeTlRef.current?.kill();

        const panelElements = getPanelElements(currentPanel);
        const { itemEls, numberEls, socialTitle, socialLinks } = panelElements;
        const all: HTMLElement[] = [...layers, currentPanel];

        if (reduced) {
          gsap.set(all, { xPercent: OFFSCREEN_X });
          resetPanelContent(panelElements);
          closeTlRef.current = null;
          return;
        }

        const timeline = gsap.timeline();

        timeline.to(all, {
          xPercent: OFFSCREEN_X,
          duration: 0.32,
          ease: "power3.in",
          overwrite: "auto",
        });

        if (itemEls.length) {
          timeline.set(itemEls, maskedTextHiddenVars());
        }
        if (numberEls.length) {
          timeline.set(numberEls, { "--sm-num-opacity": 0 });
        }
        if (socialTitle) {
          timeline.set(socialTitle, { opacity: 0 });
        }
        if (socialLinks.length) {
          timeline.set(socialLinks, { y: 25, opacity: 0 });
        }

        closeTlRef.current = timeline;
      });

      animateIconRef.current = contextSafe((opening: boolean) => {
        const currentIcon = iconRef.current;
        if (!currentIcon) return;

        spinTweenRef.current?.kill();

        if (reduced) {
          gsap.set(currentIcon, { rotate: opening ? 225 : 0 });
          spinTweenRef.current = null;
          return;
        }

        spinTweenRef.current = gsap.to(currentIcon, {
          rotate: opening ? 225 : 0,
          duration: opening ? 0.8 : 0.35,
          ease: opening ? "power4.out" : "power3.inOut",
          overwrite: "auto",
        });
      });

      animateColorRef.current = contextSafe((opening: boolean) => {
        const button = toggleBtnRef.current;
        if (!button) return;

        colorTweenRef.current?.kill();

        if (reduced) {
          gsap.set(button, { color: opening ? OPEN_MENU_BUTTON_COLOR : MENU_BUTTON_COLOR });
          colorTweenRef.current = null;
          return;
        }

        colorTweenRef.current = gsap.to(button, {
          color: opening ? OPEN_MENU_BUTTON_COLOR : MENU_BUTTON_COLOR,
          delay: 0.18,
          duration: 0.3,
          ease: "power2.out",
        });
      });

      animateTextRef.current = contextSafe((opening: boolean) => {
        const inner = textInnerRef.current;
        if (!inner) return;

        textCycleAnimRef.current?.kill();

        const currentLabel = opening ? labels.menu : labels.close;
        const targetLabel = opening ? labels.close : labels.menu;

        if (reduced) {
          // 不做滚动式换字，直接显示目标标签
          setTextLines([targetLabel]);
          gsap.set(inner, { yPercent: 0 });
          textCycleAnimRef.current = null;
          return;
        }
        const sequence = [currentLabel];
        let last = currentLabel;

        for (let index = 0; index < 3; index += 1) {
          last = last === labels.menu ? labels.close : labels.menu;
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
      });

      return () => {
        openTlRef.current?.kill();
        closeTlRef.current?.kill();
        spinTweenRef.current?.kill();
        textCycleAnimRef.current?.kill();
        colorTweenRef.current?.kill();
        openTlRef.current = null;
        closeTlRef.current = null;
        spinTweenRef.current = null;
        textCycleAnimRef.current = null;
        colorTweenRef.current = null;
        playOpenRef.current = null;
        playCloseRef.current = null;
        animateIconRef.current = null;
        animateColorRef.current = null;
        animateTextRef.current = null;
      };
    },
    { scope: wrapperRef, dependencies: [labels.menu, labels.close] }
  );

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpenRef.current?.();
    } else {
      onMenuClose?.();
      playCloseRef.current?.();
      toggleBtnRef.current?.focus();
    }

    animateIconRef.current?.(target);
    animateColorRef.current?.(target);
    animateTextRef.current?.(target);
  }, [onMenuClose, onMenuOpen]);

  const closeMenu = useCallback(() => {
    if (!openRef.current) return;

    openRef.current = false;
    setOpen(false);
    onMenuClose?.();
    playCloseRef.current?.();
    animateIconRef.current?.(false);
    animateColorRef.current?.(false);
    animateTextRef.current?.(false);
    toggleBtnRef.current?.focus();
  }, [onMenuClose]);

  // 菜单打开时锁住背景滚动。
  // Lenis 虚拟化了滚轮事件，CSS 的 overflow 锁不住它 —— 必须调它自己的 stop()
  // （lenis.css 的 .lenis-stopped 会同时把 overflow 设为 clip）。
  // Lenis 未启用时（减弱动画偏好 / Studio）回退到原生 overflow 锁。
  useEffect(() => {
    if (!open) return;

    if (lenis) {
      lenis.stop();
      return () => lenis.start();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lenis, open]);

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
    <div
      ref={wrapperRef}
      className="staggered-menu-wrapper"
      data-open={open ? "true" : undefined}
    >
      <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
        {PRE_LAYER_COLORS.map((color, index) => (
          <div key={`${color}-${index}`} className="sm-prelayer" style={{ background: color }} />
        ))}
      </div>

      <header className="staggered-menu-header" aria-label={labels.headerAria}>
        <button
          ref={toggleBtnRef}
          className="sm-toggle"
          aria-label={open ? labels.closeMenu : labels.openMenu}
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
                  <span className="sm-panel-itemLabel">{labels.noItems}</span>
                </span>
              </li>
            )}
          </ul>

          {socialItems.length > 0 && (
            <div className="sm-socials" aria-label={labels.socialLinksAria}>
              <h3 className="sm-socials-title">{labels.socials}</h3>
              <ul className="sm-socials-list" role="list">
                {socialItems.map((item, index) => (
                  <li key={`${item.label}-${index}`} className="sm-socials-item">
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="sm-socials-link">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>

              {languageItems.length > 0 && (
                <div className="sm-language">
                  <h3 className="sm-socials-title">{labels.language}</h3>
                  <ul className="sm-socials-list" role="list">
                    {languageItems.map((item) => (
                      <li key={item.link} className="sm-socials-item">
                        <a
                          href={item.link}
                          aria-label={item.ariaLabel}
                          aria-current={item.current ? "page" : undefined}
                          className="sm-socials-link"
                          onClick={closeMenu}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default StaggeredMenu;
