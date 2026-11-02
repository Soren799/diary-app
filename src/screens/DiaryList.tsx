/**
 * 日记列表：按月分组的日卡时间线。
 * 顶部是一条悬浮的玻璃栏（品牌 + 统计 + 主题切换），右下角玻璃 FAB 直达今天。
 */
import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Menu, Plus } from 'lucide-react'
import GlassSurface from '@/components/GlassSurface'
import GradualBlur from '@/components/GradualBlur'
import MoodFace from '@/components/MoodFace'
import { EASE } from '@/lib/animation'
import { formatClock, monthLabel, monthOf, todayKey, weekdayOf, yearOf } from '@/lib/format'
import { sortedDays } from '@/lib/store'
import type { DiaryDay } from '@/lib/types'
import { cn } from '@/lib/cn'

interface DiaryListProps {
  days: DiaryDay[]
  onOpenDay: (date: string) => void
  onOpenSettings: () => void
}

export default function DiaryList({ days, onOpenDay, onOpenSettings }: DiaryListProps) {
  const today = todayKey()
  const sorted = useMemo(() => sortedDays(days), [days])

  /** 按「年-月」分组（sorted 已按日期倒序，相邻同月即为一组） */
  const groups = useMemo(() => {
    const out: { key: string; label: string; days: DiaryDay[] }[] = []
    for (const day of sorted) {
      const key = `${yearOf(day.date)}-${monthOf(day.date)}`
      const last = out[out.length - 1]
      if (last && last.key === key) last.days.push(day)
      else out.push({ key, label: `${yearOf(day.date)} 年 ${monthLabel(day.date)}`, days: [day] })
    }
    return out
  }, [sorted])

  const monthDays = days.filter(day => monthOf(day.date) === monthOf(today))
  const monthEntryCount = monthDays.reduce((sum, day) => sum + day.entries.length, 0)

  return (
    <div className="relative mx-auto flex min-h-svh w-full max-w-[440px] flex-col px-4">
      {/* 顶部悬浮玻璃栏（避开系统状态栏：--safe-top 见 index.css） */}
      <div className="sticky top-0 z-30" style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}>
        <GlassSurface width="100%" height={56} borderRadius={28}>
          <div className="flex w-full items-center justify-between px-2.5">
            <div className="flex items-center gap-2.5 pl-0.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: 'var(--brand)' }} />
              <span className="font-serif text-[15px] tracking-wide text-ink">奇想日记</span>
            </div>
            <div className="flex items-center gap-2 pr-0.5">
              <span className="text-[11px] tabular-nums text-ink-3">
                {monthOf(today)} 月 {monthDays.length} 天 · {monthEntryCount} 笔
              </span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="btn-ghost size-8"
                aria-label="打开设置"
              >
                <Menu size={16} />
              </button>
            </div>
          </div>
        </GlassSurface>
      </div>

      {/* 标题 */}
      <header className="px-1 pb-2 pt-10">
        <p className="text-[11px] font-medium tracking-[0.45em] text-brand-ink uppercase">
          Whim Journal
        </p>
        <h1 className="mt-2.5 font-serif text-[2.6rem] leading-none text-ink">日记</h1>
        <p className="mt-3.5 text-sm text-ink-2">
          {groups.length > 0
            ? '想法来的时候，先记下来。剩下的，交给时间。'
            : '一切尚未开始。'}
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-28 text-center">
          <p className="font-serif text-2xl text-ink-2">把念头留下。</p>
          <p className="mt-3 text-sm text-ink-3">右下角，写下今天的第一笔。</p>
        </div>
      ) : (
        groups.map(group => (
          <section key={group.key} className="mt-7">
            <div className="mb-3 flex items-baseline gap-3 px-1">
              <h2 className="font-serif text-sm tracking-[0.2em] text-ink-2">{group.label}</h2>
              <span className="text-[11px] tabular-nums text-ink-3">{group.days.length} 天</span>
              <div className="h-px flex-1 bg-line" />
            </div>
            <div className="flex flex-col gap-2.5">
              {group.days.map((day, index) => (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE, delay: Math.min(index * 0.05, 0.3) }}
                >
                  <DayCard day={day} today={today} onOpen={onOpenDay} />
                </motion.div>
              ))}
            </div>
          </section>
        ))
      )}

      {/* 底部留白：给悬浮的 FAB 让位 */}
      <div className="h-24" />

      {/* FAB：记今天的日记 */}
      <div
        className="pointer-events-none fixed z-30"
        style={{
          right: 'max(1.5rem, calc(50% - 220px + 1.5rem))',
          bottom: 'calc(1.5rem + var(--safe-bottom))',
        }}
      >
        <GlassSurface width={56} height={56} borderRadius={999} className="pointer-events-auto">
          <button
            type="button"
            onClick={() => onOpenDay(today)}
            className="flex size-full items-center justify-center rounded-full text-ink transition-transform duration-200 active:scale-90"
            aria-label="记今天的日记"
          >
            <Plus size={22} strokeWidth={1.75} />
          </button>
        </GlassSurface>
      </div>

      <GradualBlur position="top" height="3.5rem" strength={1.8} divCount={3} />
    </div>
  )
}

function DayCard({
  day,
  today,
  onOpen,
}: {
  day: DiaryDay
  today: string
  onOpen: (date: string) => void
}) {
  const isToday = day.date === today
  const first = day.entries[0]
  const last = day.entries[day.entries.length - 1]

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(day.date)}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      className="card flex w-full items-start gap-4 rounded-2xl px-4 py-3.5 text-left"
    >
      {/* 日期竖块 */}
      <div className="flex w-11 shrink-0 flex-col items-center pt-0.5">
        <span
          className={cn(
            'font-serif text-[1.65rem] leading-none',
            isToday ? 'text-brand-ink' : 'text-ink',
          )}
        >
          {Number(day.date.slice(8))}
        </span>
        <span className="mt-1.5 text-[11px] text-ink-3">{weekdayOf(day.date)}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {isToday && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] leading-none"
              style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--brand-ink)' }}
            >
              今天
            </span>
          )}
          <span className="flex items-center gap-1.5">
            {day.entries.map(entry =>
              entry.mood ? (
                <MoodFace key={entry.id} mood={entry.mood} className="w-[18px] shrink-0 text-ink-3" />
              ) : null,
            )}
          </span>
          <span className="ml-auto shrink-0 text-[11px] tabular-nums text-ink-3">
            {day.entries.length} 笔 · 至 {formatClock(last.time)}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed text-ink-2">
          {first.text}
        </p>
      </div>
    </motion.button>
  )
}
