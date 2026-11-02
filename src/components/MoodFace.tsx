/**
 * 心情表情脸 —— 参照 Suki「表情传达心情」的直白，但不用系统 emoji，
 * 而是自绘的单色线稿简笔脸（圆头 + 五官随心情变化）：
 *   很好 = 眯眼大笑；不错 = 圆眼微笑；一般 = 平静；有点低 = 闭眼抿嘴；不好 = 愁眉苦脸。
 * currentColor 描边，浅色下是灰墨、深色下是浅墨，自动跟主题。
 */
import type { ReactNode } from 'react'
import type { Mood } from '@/lib/types'

const FACES: Record<Mood, ReactNode> = {
  great: (
    <>
      {/* 眯成两条弧的笑眼 + 大笑嘴 */}
      <path d="M9 14 Q11 11.5 13 14" />
      <path d="M19 14 Q21 11.5 23 14" />
      <path d="M10 19.5 Q16 26 22 19.5" />
    </>
  ),
  good: (
    <>
      <circle cx="11" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="21" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <path d="M11 20 Q16 24.5 21 20" />
    </>
  ),
  ok: (
    <>
      <circle cx="11" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="21" cy="14" r="1.2" fill="currentColor" stroke="none" />
      <path d="M11.5 21.5 Q16 23 20.5 21.5" />
    </>
  ),
  low: (
    <>
      {/* 闭上的眼 + 轻轻撇起的嘴 */}
      <path d="M9 15 H13" />
      <path d="M19 15 H23" />
      <path d="M11 23 Q16 19.5 21 23" />
    </>
  ),
  bad: (
    <>
      {/* 八字愁眉 + 委屈的嘴 */}
      <path d="M8.5 11.5 L13 13.5" />
      <path d="M23.5 11.5 L19 13.5" />
      <circle cx="11.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="20.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
      <path d="M10.5 24.5 Q16 18.5 21.5 24.5" />
    </>
  ),
}

interface MoodFaceProps {
  mood: Mood
  className?: string
}

export default function MoodFace({ mood, className }: MoodFaceProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="16" r="13" />
        {FACES[mood]}
      </g>
    </svg>
  )
}
