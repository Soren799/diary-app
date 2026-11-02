/**
 * 组件来源：React Bits —— https://reactbits.dev/components/glass-surface
 * 自网站项目移植（那份已内联并做过防抖等适配），本处唯一改动：
 *   原来固定按深色渲染（isDarkMode = true），这里接入 useTheme()
 *   跟随本应用的浅 / 深主题切换渲染分支。
 *
 * 原理：SVG 滤镜做真实的边缘折射与色散（feDisplacementMap + 三通道分离），
 * 再通过 backdrop-filter 作用到背后的内容上；不支持的浏览器退化成普通毛玻璃。
 */
import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from '@/lib/theme'

export interface GlassSurfaceProps {
  children?: ReactNode
  width?: number | string
  height?: number | string
  borderRadius?: number
  borderWidth?: number
  brightness?: number
  opacity?: number
  blur?: number
  /** 毛玻璃强度（px）：叠在折射之后的一层弱 backdrop blur，很弱，默认 2.5 */
  frost?: number
  displace?: number
  backgroundOpacity?: number
  saturation?: number
  distortionScale?: number
  redOffset?: number
  greenOffset?: number
  blueOffset?: number
  xChannel?: 'R' | 'G' | 'B'
  yChannel?: 'R' | 'G' | 'B'
  mixBlendMode?:
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion'
    | 'hue'
    | 'saturation'
    | 'color'
    | 'luminosity'
    | 'plus-darker'
    | 'plus-lighter'
  className?: string
  style?: CSSProperties
}

/** 浏览器是否支持把 SVG 滤镜用在 backdrop-filter 上（Safari / Firefox 不支持，会退化成普通毛玻璃） */
function supportsSVGFilters(filterId: string): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
  const isFirefox = /Firefox/.test(navigator.userAgent)

  if (isWebkit || isFirefox) {
    return false
  }

  // 触屏真机不走 SVG 位移折射：backdrop-filter: url() 在移动 GPU 上逐帧重算代价高，
  // 而小屏上折射本身几乎不可见——退回普通磨玻璃，观感几乎一致，滚动明显更顺。
  if (window.matchMedia?.('(pointer: coarse)').matches) {
    return false
  }

  const div = document.createElement('div')
  div.style.backdropFilter = `url(#${filterId})`

  return div.style.backdropFilter !== ''
}

function supportsBackdropFilter(): boolean {
  if (typeof window === 'undefined') return false
  return CSS.supports('backdrop-filter', 'blur(10px)')
}

const GlassSurface = ({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  frost = 2.5,
  displace = 0,
  backgroundOpacity = 0.08,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  className = '',
  style = {},
}: GlassSurfaceProps) => {
  const uniqueId = useId().replace(/:/g, '-')
  const filterId = `glass-filter-${uniqueId}`
  const redGradId = `red-grad-${uniqueId}`
  const blueGradId = `blue-grad-${uniqueId}`

  const [svgSupported, setSvgSupported] = useState<boolean>(false)
  const isDarkMode = useTheme() === 'dark'

  const containerRef = useRef<HTMLDivElement>(null)
  const feImageRef = useRef<SVGFEImageElement>(null)
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null)
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null)
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null)
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null)

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect()
    const actualWidth = rect?.width || 400
    const actualHeight = rect?.height || 200
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5)

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`
  }

  const updateDisplacementMap = () => {
    feImageRef.current?.setAttribute('href', generateDisplacementMap())
  }

  useEffect(() => {
    updateDisplacementMap()
    ;[
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset },
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString())
        ref.current.setAttribute('xChannelSelector', xChannel)
        ref.current.setAttribute('yChannelSelector', yChannel)
      }
    })

    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
  ])

  useEffect(() => {
    setSvgSupported(supportsSVGFilters(filterId))
  }, [filterId])

  useEffect(() => {
    if (!containerRef.current) return

    let settle = 0

    // 尺寸变化时不要每帧重算：map 是一整段 SVG data URL，生成 + 编码 + 重新栅格化都很贵。
    // 等尺寸稳定再更新一次（网站的 GlassSurface 也是这么改的）。
    const resizeObserver = new ResizeObserver(() => {
      window.clearTimeout(settle)
      settle = window.setTimeout(updateDisplacementMap, 120)
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      window.clearTimeout(settle)
      resizeObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setTimeout(updateDisplacementMap, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])

  const getContainerStyles = (): CSSProperties => {
    const baseStyles: CSSProperties = {
      ...style,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius: `${borderRadius}px`,
      '--glass-frost': backgroundOpacity,
      '--glass-saturation': saturation,
    } as CSSProperties

    const backdropFilterSupported = supportsBackdropFilter()

    if (svgSupported) {
      return {
        ...baseStyles,
        background: isDarkMode
          ? `hsl(0 0% 0% / ${backgroundOpacity})`
          : `hsl(0 0% 100% / ${backgroundOpacity})`,
        backdropFilter: `url(#${filterId}) saturate(${saturation}) blur(${frost}px)`,
        boxShadow: isDarkMode
          ? `0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset,
             0 0 10px 4px color-mix(in oklch, white, transparent 85%) inset,
             0px 4px 16px rgba(17, 17, 26, 0.05),
             0px 8px 24px rgba(17, 17, 26, 0.05),
             0px 16px 56px rgba(17, 17, 26, 0.05),
             0px 4px 16px rgba(17, 17, 26, 0.05) inset,
             0px 8px 24px rgba(17, 17, 26, 0.05) inset,
             0px 16px 56px rgba(17, 17, 26, 0.05) inset`
          : `0 0 2px 1px color-mix(in oklch, black, transparent 85%) inset,
             0 0 10px 4px color-mix(in oklch, black, transparent 90%) inset,
             0px 4px 16px rgba(17, 17, 26, 0.06),
             0px 8px 24px rgba(17, 17, 26, 0.06),
             0px 16px 56px rgba(17, 17, 26, 0.06),
             0px 4px 16px rgba(255, 255, 255, 0.5) inset,
             0px 8px 24px rgba(255, 255, 255, 0.35) inset,
             0px 16px 56px rgba(255, 255, 255, 0.25) inset`,
      }
    }

    if (isDarkMode) {
      if (!backdropFilterSupported) {
        return {
          ...baseStyles,
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
                      inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)`,
        }
      }
      return {
        ...baseStyles,
        // 触屏/降级档：底色压到极淡（更透），模糊收细，磨砂只留一层意思
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: `blur(${3 + frost}px) saturate(1.8) brightness(1.1)`,
        WebkitBackdropFilter: `blur(${3 + frost}px) saturate(1.8) brightness(1.1)`,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.2),
                    inset 0 -1px 0 0 rgba(255, 255, 255, 0.1)`,
      }
    }

    if (!backdropFilterSupported) {
      return {
        ...baseStyles,
        background: 'rgba(255, 255, 255, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
                    inset 0 -1px 0 0 rgba(255, 255, 255, 0.3)`,
      }
    }
    return {
      ...baseStyles,
      background: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: `blur(${3 + frost}px) saturate(1.8) brightness(1.1)`,
      WebkitBackdropFilter: `blur(${3 + frost}px) saturate(1.8) brightness(1.1)`,
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.12),
                  0 2px 16px 0 rgba(31, 38, 135, 0.06),
                  inset 0 1px 0 0 rgba(255, 255, 255, 0.5),
                  inset 0 -1px 0 0 rgba(255, 255, 255, 0.25)`,
    }
  }

  const glassSurfaceClasses =
    'relative flex items-center justify-center overflow-hidden transition-opacity duration-[260ms] ease-out'

  return (
    <div
      ref={containerRef}
      className={`${glassSurfaceClasses} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
      style={getContainerStyles()}
    >
      <svg
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feImage
              ref={feImageRef}
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />

            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />

            <feDisplacementMap
              ref={greenChannelRef}
              in="SourceGraphic"
              in2="map"
              id="greenchannel"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />

            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />

            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      <div className="relative z-10 flex h-full w-full items-center justify-center rounded-[inherit] p-2">
        {children}
      </div>
    </div>
  )
}

export default GlassSurface
