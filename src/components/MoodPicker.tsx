/**
 * 心情选择：五张表情小脸一字排开，选中的那张有淡紫衬底 + 提亮；
 * 再点一次同档取消。选中后的文字标签由调用方显示在别处。
 */
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
          <button
            key={mood.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={mood.label}
            title={mood.label}
            onClick={() => onChange(selected ? undefined : mood.id)}
            className={cn(
              'flex size-9 items-center justify-center rounded-full transition-all duration-200',
              selected ? 'text-brand-ink' : 'text-ink-3 hover:text-ink-2',
            )}
            style={selected ? { backgroundColor: 'var(--brand-soft)' } : undefined}
          >
            <MoodFace mood={mood.id} className="w-[26px]" />
          </button>
        )
      })}
    </div>
  )
}
