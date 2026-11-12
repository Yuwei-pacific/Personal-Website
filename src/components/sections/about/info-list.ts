// 关于页信息列表（基本信息 / 学历 / 经历 / 能力）共用的悬停聚焦样式。
//
// 鼠标进入列表时，没被指着的行整体变淡，被指着的那行保持原样 —— 一种阅读辅助，
// 所有行都有，与能不能点无关。「能点」另由 resume-list.tsx 里的箭头和悬停右移表达，
// 两件事不混在一起。
//
// 用法：列表容器加 infoListClassName，每一行加 infoRowFocusClassName。
// 注意别把 infoRowFocusClassName 直接加在 StaggerReveal 的直接子元素上：GSAP 的入场动画
// 会在那一层逐帧写内联 opacity，叠上这里的 opacity 过渡会互相拖拽，要再包一层。
// hover 变体已由 tailwind 的 hoverOnlyWhenSupported 限定在支持悬停的设备上。
export const infoListClassName = "group/list";

export const infoRowFocusClassName =
  "transition-opacity duration-base motion-reduce:transition-none group-hover/list:[&:not(:hover)]:opacity-40";
