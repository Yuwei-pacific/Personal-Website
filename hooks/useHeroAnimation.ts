import { useEffect } from "react";

// 在客户端动态加载 anime 库
let animeLib: any = null;

async function getAnime() {
    if (!animeLib && typeof window !== "undefined") {
        // 从 UMD 版本加载（这是浏览器友好的）
        if (!window.anime) {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js";
            script.async = true;
            document.body.appendChild(script);

            // 等待脚本加载
            await new Promise((resolve) => {
                script.onload = resolve;
            });
        }
        animeLib = window.anime;
    }
    return animeLib;
}

export function useHeroAnimation() {
    useEffect(() => {
        const initAnimation = async () => {
            const anime = await getAnime();

            if (!anime) return;

            // 淡入和滑上标题
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

            // 悬停按钮时的动画效果
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
        };

        initAnimation();
    }, []);
}
