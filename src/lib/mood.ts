import type { Mood } from '@/lib/types'

/** 五档心情，按「从好到差」排列。图形表达见 MoodFace（表情脸），这里只管文案。 */
export const MOODS: { id: Mood; label: string }[] = [
  { id: 'great', label: '很好' },
  { id: 'good', label: '不错' },
  { id: 'ok', label: '一般' },
  { id: 'low', label: '有点低' },
  { id: 'bad', label: '不好' },
]

export function moodOf(id?: Mood) {
  return MOODS.find(item => item.id === id)
}
