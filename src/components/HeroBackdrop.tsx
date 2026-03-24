"use client";

/**
 * 首页 Hero 背后的动态背景：柔光光斑 + 渐变流动 + 细网格。
 * 纯 CSS 动画，无额外依赖；用户开启「减少动态效果」时自动静止。
 */
export function HeroBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* 保留原有顶部径向高光，与动效层融合 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]" />

      {/* 大面积流动渐变（极低透明度，增加层次） */}
      <div className="hero-mesh absolute -left-1/4 -top-1/4 h-[150%] w-[150%] opacity-[0.65]" />

      {/* 三个模糊光球，不同周期漂移 */}
      <div className="hero-blob hero-blob-a" />
      <div className="hero-blob hero-blob-b" />
      <div className="hero-blob hero-blob-c" />

      {/* 细网格 + 缓慢平移 */}
      <div className="hero-grid-shift absolute inset-0 opacity-[0.35]" />

      {/* 底部暗角，让文字更稳 */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
    </div>
  );
}
