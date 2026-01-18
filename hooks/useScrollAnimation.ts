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

export function useScrollAnimation() {
    useEffect(() => {
        const initAnimation = async () => {
            const anime = await getAnime();

            if (!anime) return;

            // 观察项目卡片元素
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !entry.target.classList.contains("animated")) {
                            // 标记为已动画化，避免重复执行
                            entry.target.classList.add("animated");

                            // 获取卡片索引用于错开动画
                            const index = Array.from(entry.target.parentElement?.children || []).indexOf(
                                entry.target as Element
                            );

                            // 执行滑入和淡入动画
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
                    threshold: 0.1,
                    rootMargin: "0px 0px -100px 0px",
                }
            );

            // 观察所有带有 scroll-animate 类的元素
            const elements = document.querySelectorAll(".scroll-animate");
            elements.forEach((el) => observer.observe(el));

            return () => {
                elements.forEach((el) => observer.unobserve(el));
            };
        };

        initAnimation();
    }, []);
}
