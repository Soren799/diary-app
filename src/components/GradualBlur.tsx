/**
 * 组件来源：React Bits —— https://reactbits.dev/animations/gradual-blur（自网站项目移植）。
 * 本原型只用「视口底部」这一种形态，所以裁掉了 top/left/right、hover、
 * responsive 与动画 props，只保留核心：叠 N 层 div，每层一条渐变遮罩 +
 * 递增的 backdrop-filter blur，合成从清晰到虚化的过渡带。
 *
 * 手机端性能提示：每层都是一次 backdrop-filter，divCount 别给太大（这里默认 4）。
 */
import { memo, useMemo } from 'react'

export interface GradualBlurProps {
  /** 贴住视口的哪一侧：top = 内容向上滚出时渐渐虚化（推特状态栏那种） */
  position?: 'top' | 'bottom'
  /** 过渡带总高 */
  height?: string
  /** 模糊强度倍率 */
  strength?: number
  /** 分层层数，越多过渡越细腻、GPU 越贵 */
  divCount?: number
  /** 曲线：linear / bezier / ease-in / ease-out */
  curve?: 'linear' | 'bezier' | 'ease-in' | 'ease-out' | 'ease-in-out'
  opacity?: number
  /** 是否指数曲线（末端模糊陡增） */
  exponential?: boolean
  className?: string
}

const CURVE_FUNCTIONS: Record<string, (p: number) => number> = {
  linear: p => p,
  bezier: p => p * p * (3 - 2 * p),
  'ease-in': p => p * p,
  'ease-out': p => 1 - Math.pow(1 - p, 2),
  'ease-in-out': p => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
}

const GradualBlur = ({
  position = 'bottom',
  height = '7rem',
  strength = 2,
  divCount = 4,
  curve = 'bezier',
  opacity = 1,
  exponential = false,
  className = '',
}: GradualBlurProps) => {
  const layers = useMemo(() => {
    const increment = 100 / divCount
    const curveFunc = CURVE_FUNCTIONS[curve] ?? CURVE_FUNCTIONS.linear
    // to top：遮罩从底往顶算，最深一层的「黑窗」落在顶端——越靠视口顶边越糊
    const direction = position === 'top' ? 'to top' : 'to bottom'

    return Array.from({ length: divCount }, (_, index) => {
      const i = index + 1
      let progress = i / divCount
      progress = curveFunc(progress)

      const blurValue = exponential
        ? Number(Math.pow(2, progress * 4)) * 0.0625 * strength
        : 0.0625 * (progress * divCount + 1) * strength

      const p1 = Math.round((increment * i - increment) * 10) / 10
      const p2 = Math.round(increment * i * 10) / 10
      const p3 = Math.round((increment * i + increment) * 10) / 10
      const p4 = Math.round((increment * i + increment * 2) * 10) / 10

      let gradient = `transparent ${p1}%, black ${p2}%`
      if (p3 <= 100) gradient += `, black ${p3}%`
      if (p4 <= 100) gradient += `, transparent ${p4}%`

      return (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            maskImage: `linear-gradient(${direction}, ${gradient})`,
            WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            opacity,
          }}
        />
      )
    })
  }, [curve, divCount, exponential, opacity, position, strength])

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 z-20 ${position === 'top' ? 'top-0' : 'bottom-0'} ${className}`}
      style={{ height }}
    >
      <div className="relative h-full w-full">{layers}</div>
    </div>
  )
}

export default memo(GradualBlur)
