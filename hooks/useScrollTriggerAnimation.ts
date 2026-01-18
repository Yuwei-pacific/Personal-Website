import { useEffect } from "react";

// 在客户端动态加载 anime 库
let animeLib: any = null;

async function getAnime() {
    if (!animeLib && typeof window !== "undefined") {
        if (!window.anime) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js";
            script.async = true;
            document.body.appendChild(script);

            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }
        animeLib = window.anime;
    }
    return animeLib;
}

export function useScrollTriggerAnimation() {
    useEffect(() => {
        const initAnimation = async () => {
            const anime = await getAnime();

            if (!anime) return;

            // Hero section 动画 - 基于滚动触发
            const heroObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !entry.target.classList.contains("hero-animated")) {
                            entry.target.classList.add("hero-animated");

                            // 淡入和滑上标题序列
                            anime
                                .timeline()
                                .add({
                                    targets: ".hero-label",
                                    opacity: [0, 1],
                                    translateY: [20, 0],
                                    duration: 800,
                                    easing: "easeOutQuad",
                                })
                                .add(
                                    {
                                        targets: ".hero-title",
                                        opacity: [0, 1],
                                        translateY: [30, 0],
                                        duration: 800,
                                        easing: "easeOutQuad",
                                    },
                                    "-=600"
                                )
                                .add(
                                    {
                                        targets: ".hero-description",
                                        opacity: [0, 1],
                                        translateY: [20, 0],
                                        duration: 800,
                                        easing: "easeOutQuad",
                                    },
                                    "-=600"
                                )
                                .add(
                                    {
                                        targets: ".hero-status",
                                        opacity: [0, 1],
                                        translateY: [15, 0],
                                        duration: 600,
                                        easing: "easeOutQuad",
                                    },
                                    "-=500"
                                )
                                .add(
                                    {
                                        targets: ".hero-cta",
                                        opacity: [0, 1],
                                        translateY: [20, 0],
                                        duration: 600,
                                        easing: "easeOutQuad",
                                        delay: anime.stagger(150),
                                    },
                                    "-=400"
                                );

                            // 社交图标淡入动画
                            anime({
                                targets: ".hero-social-icon",
                                opacity: [0, 1],
                                scale: [0.8, 1],
                                duration: 600,
                                easing: "easeOutQuad",
                                delay: anime.stagger(100, { start: 1000 }),
                            });

                            // 背景元素缓慢浮动
                            anime({
                                targets: ".hero-background",
                                translateY: [-20, 20],
                                duration: 6000,
                                direction: "alternate",
                                loop: true,
                                easing: "easeInOutQuad",
                            });
                        }
                    });
                },
                {
                    threshold: 0.3,
                    rootMargin: "0px 0px 0px 0px",
                }
            );

            // 观察 hero section
            const heroSection = document.querySelector("section.relative.isolate.flex");
            if (heroSection) {
                heroObserver.observe(heroSection);
            }

            // 项目卡片滚动动画
            const cardObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !entry.target.classList.contains("animated")) {
                            entry.target.classList.add("animated");

                            const index = Array.from(entry.target.parentElement?.children || []).indexOf(
                                entry.target as Element
                            );

                            anime({
                                targets: entry.target,
                                opacity: [0, 1],
                                translateY: [40, 0],
                                duration: 700,
                                delay: index * 100,
                                easing: "easeOutQuad",
                            });
                        }
                    });
                },
                {
                    threshold: 0.2,
                    rootMargin: "0px 0px -50px 0px",
                }
            );

            // 观察所有带有 scroll-animate 类的元素
            const elements = document.querySelectorAll(".scroll-animate");
            elements.forEach((el) => cardObserver.observe(el));

            // 按钮悬停效果
            const buttons = document.querySelectorAll(".hero-cta");
            buttons.forEach((button) => {
                button.addEventListener("mouseenter", () => {
                    anime({
                        targets: button,
                        scale: 1.05,
                        duration: 300,
                        easing: "easeOutQuad",
                    });
                });

                button.addEventListener("mouseleave", () => {
                    anime({
                        targets: button,
                        scale: 1,
                        duration: 300,
                        easing: "easeOutQuad",
                    });
                });
            });

            return () => {
                heroObserver.disconnect();
                cardObserver.disconnect();
            };
        };

        initAnimation();
    }, []);
}
