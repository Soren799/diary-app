/**
 * 心情选择：五张表情小脸一字排开，选中的那张弹性放大 + 淡紫衬底；
 * 按下有回弹，再点一次同档取消。选中后的文字标签由调用方显示在别处。
 */
import { motion } from 'motion/react'
import MoodFace from '@/components/MoodFace'
import { MOODS } from '@/lib/mood'
import type { Mood } from '@/lib/types'
import { cn } from '@/lib/cn'

interface MoodPickerProps {
  value?: Mood
  onChange: (mood: Mood | undefined) => void
}

export default function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="此刻的心情">
      {MOODS.map(mood => {
        const selected = value === mood.id
        return (
          <motion.button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={mood.label}
            title={mood.label}
            onClick={() => onChange(selected ? undefined : mood.id)}
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 600, damping: 28 }}
            className={cn(
              'flex size-9 items-center justify-center rounded-full transition-colors duration-200',
              selected ? 'text-brand-ink' : 'text-ink-3 hover:text-ink-2',
            )}
            style={selected ? { backgroundColor: 'var(--brand-soft)' } : undefined}
          >
            <motion.span
              className="flex"
              animate={{ scale: selected ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <MoodFace mood={mood.id} className="w-[26px]" />
            </motion.span>
          </motion.button>
        )
      })}
    </div>
  )
}
