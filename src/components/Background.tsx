/**
 * 背景：纯色 + 顶部一处极淡的径向光晕 + 极淡噪点。
 * 沿用网站的取向（Linear / Vercel / Apple 式的克制），颜色来自主题 token，
 * 浅色是暖纸面上的一点紫晕，深色是 void 底上的一点紫晕。
 */
export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-paper">
      <div
        className="absolute inset-x-0 -top-64 h-[52rem]"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, var(--glow) 0%, transparent 66%)',
        }}
      />
      <div className="noise absolute inset-0" />
    </div>
  )
}
