# Anime.js 动画集成文档

## 概述

已成功将 **Anime.js** 集成到您的个人网站中，为 Hero 区和项目卡片添加了流畅的动画效果。

## 🎬 已实现的动画

### 1. **Hero 区动画** (`components/sections/hero.tsx`)

#### 序列化入场动画
- **标签** (Portfolio): 从下方淡入 + 向上滑动 (800ms)
- **标题** (Creative Designer): 从下方淡入 + 向上滑动 (800ms, 延迟 200ms)
- **描述文本**: 从下方淡入 + 向上滑动 (800ms, 延迟 200ms)
- **状态标签** (Based in Milan / Available for freelance): 淡入 (600ms)
- **CTA 按钮**: 依次淡入 + 向上滑动，使用错开延迟 (600ms, 每个延迟 150ms)

#### 图标动画
- **社交媒体图标** (GitHub, LinkedIn, Instagram): 
  - 从小到大缩放 + 淡入
  - 延迟 1000ms 后开始，每个间隔 100ms

#### 背景动画
- **背景图形**: 连续浮动效果
  - 上下浮动 (-20px 到 +20px)
  - 6000ms 循环周期
  - 无限循环

#### 交互动画
- **按钮悬停效果**:
  - 鼠标悬停时放大 1.05 倍 (300ms)
  - 鼠标离开时回到原大小 (300ms)
  - 平滑的 easeOutQuad 缓动

### 2. **滚动进入动画** (`hooks/useScrollAnimation.ts`)

#### 项目卡片动画
- **触发条件**: 当卡片进入视窗 10% 时
- **动画效果**:
  - 从下方淡入 (0% → 100% 透明度)
  - 向上滑动 (40px → 0px)
  - 动画时长: 700ms
  - 错开延迟: 每张卡片延迟 100ms (形成级联效果)
  - 缓动函数: easeOutQuad

## 📁 相关文件结构

```
hooks/
├── useHeroAnimation.ts      # Hero 区动画 Hook
└── useScrollAnimation.ts    # 滚动进入动画 Hook

components/
├── sections/
│   └── hero.tsx            # 已更新的 Hero 组件（使用"use client"）
├── projects/
│   └── project-card.tsx    # 已更新的项目卡片（添加 scroll-animate 类）
└── providers/
    └── animation-provider.tsx  # 全局动画 Provider

app/
└── layout.tsx              # 已集成 AnimationProvider

global.d.ts                 # 添加 anime 全局类型定义
```

## 🚀 技术实现细节

### 依赖库
- **animejs**: 强大的 JavaScript 动画库
- 使用 CDN 加载 (jsDelivr): `https://cdn.jsdelivr.net/npm/animejs@3/lib/anime.min.js`

### 动画加载方式
1. **动态脚本加载**: 在首次使用时从 CDN 加载 anime.js
2. **异步初始化**: 确保 DOM 已就绪后才执行动画
3. **缓存机制**: 加载后缓存 anime 库实例，避免重复加载

### CSS 类标记
- `.hero-label`: 标签
- `.hero-title`: 主标题
- `.hero-description`: 描述文本
- `.hero-status`: 状态信息
- `.hero-cta`: CTA 按钮
- `.hero-social-icon`: 社交图标
- `.hero-background`: 背景图形
- `.scroll-animate`: 滚动进入动画目标元素

## 📝 使用方式

### 现有功能 (已自动启用)

1. **Hero 区动画** - 自动在页面加载时运行
2. **项目卡片滚动动画** - 自动在卡片进入视窗时触发
3. **按钮交互动画** - 鼠标悬停时自动触发

### 为新元素添加动画

#### 添加滚动进入动画
只需为元素添加 `scroll-animate` 类：
```tsx
<div className="scroll-animate">
  {/* 您的内容 */}
</div>
```

#### 创建自定义动画
在 `hooks/` 目录中创建新的 Hook：
```typescript
export function useCustomAnimation() {
  useEffect(() => {
    const anime = await getAnime();
    // 编写您的动画逻辑
  }, []);
}
```

## 🎨 动画参数可自定义

所有动画参数都可以在相应的 Hook 中调整：
- `duration`: 动画持续时间 (ms)
- `delay`: 延迟时间 (ms)
- `easing`: 缓动函数 (easeOutQuad, easeInOutQuad 等)
- `targets`: 选择器或 DOM 元素
- `opacity`, `translateY`, `scale` 等: 动画属性

## ✅ 浏览器兼容性

Anime.js 支持所有现代浏览器：
- Chrome/Edge 26+
- Firefox 16+
- Safari 6+
- iOS Safari 8+
- Android Browser 4+

## 📦 性能考虑

1. **CDN 加载**: 从 jsDelivr 加载，加速全球访问
2. **按需加载**: 只在首次使用时加载库
3. **缓存**: 避免重复加载库文件
4. **Intersection Observer**: 使用原生 API 检测元素可见性

## 🔧 自定义建议

### 修改动画速度
编辑 `hooks/useHeroAnimation.ts` 中的 `duration` 值

### 修改延迟
编辑 `anime.stagger()` 的参数值

### 修改缓动函数
查看 [Anime.js 文档](https://animejs.com/documentation/#easing) 获取更多缓动选项

## 📚 参考资源

- [Anime.js 官方文档](https://animejs.com/)
- [Timeline 动画](https://animejs.com/documentation/#timeline)
- [Easing 函数](https://animejs.com/documentation/#easing)
- [Stagger 错开效果](https://animejs.com/documentation/#stagger)

## 🐛 故障排除

### 动画不显示
1. 检查浏览器控制台是否有错误
2. 确保 CDN 脚本已加载 (检查网络标签)
3. 确保元素有正确的选择器 (class 名称)

### 性能问题
1. 减少同时运行的动画数量
2. 增加 `duration` 值使动画更柔和
3. 检查 CPU 使用率是否过高

---

**开发者注意**: 所有动画都是在客户端执行的，不会影响 SEO 或服务器性能。
