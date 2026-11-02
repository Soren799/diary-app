/**
 * 某一天的日记：时间线 + 底部玻璃记录条。
 * 点任意一条记录进入编辑（记录条变成保存模式）；删除走确认框。
 * 记录条的时刻自动取当下，不需要手填——沿用网站日记页的约定。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUp, Check, ChevronLeft, Clock3, PenLine, Trash2, X } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import GlassSurface from '@/components/GlassSurface'
import GradualBlur from '@/components/GradualBlur'
import MoodPicker from '@/components/MoodPicker'
import MoodFace from '@/components/MoodFace'
import { EASE } from '@/lib/animation'
import { formatClock, monthLabel, parseDateKey, weekdayOf, yearOf } from '@/lib/format'
import { moodOf } from '@/lib/mood'
import { uid } from '@/lib/store'
import type { DiaryDay, DiaryEntry, Mood } from '@/lib/types'
import { cn } from '@/lib/cn'

const MONTHS_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

interface DiaryDayProps {
  date: string
  day: DiaryDay | null
  onBack: () => void
  onSaveEntry: (entry: DiaryEntry) => void
  onDeleteEntry: (id: string) => void
}

export default function DiaryDayScreen({ date, day, onBack, onSaveEntry, onDeleteEntry }: DiaryDayProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [mood, setMood] = useState<Mood | undefined>(undefined)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const textRef = useRef<HTMLTextAreaElement>(null)

  // 记录条上的「当下」：每 30 秒走一次
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  // 输入框自动长高
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  const entries = useMemo(
    () => (day ? [...day.entries].sort((a, b) => (a.time < b.time ? -1 : 1)) : []),
    [day],
  )

  /** 今天出现最多的心情，作一句摘要 */
  const dominant = useMemo(() => {
    const counts = new Map<Mood, number>()
    for (const entry of entries) {
      if (!entry.mood) continue
      counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1)
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    return top ? moodOf(top[0]) : undefined
  }, [entries])

  const editingEntry = editingId ? (entries.find(entry => entry.id === editingId) ?? null) : null

  function startEdit(entry: DiaryEntry) {
    setEditingId(entry.id)
    setText(entry.text)
    setMood(entry.mood)
    requestAnimationFrame(() => textRef.current?.focus())
  }

  function cancelEdit() {
    setEditingId(null)
    setText('')
    setMood(undefined)
  }

  function save() {
    const trimmed = text.trim()
    if (!trimmed) return
    if (editingEntry) {
      onSaveEntry({ ...editingEntry, text: trimmed, mood })
    } else {
      onSaveEntry({ id: uid(), time: new Date(now).toISOString(), text: trimmed, mood })
    }
    cancelEdit()
  }

  const pendingDelete = confirmId ? (entries.find(entry => entry.id === confirmId) ?? null) : null
  const parsed = parseDateKey(date)
  const dayNumber = parsed.getDate()

  return (
    <div className="relative mx-auto flex min-h-svh w-full max-w-[440px] flex-col px-4">
      {/* 返回（避开系统状态栏：--safe-top 见 index.css） */}
      <div className="sticky top-0 z-30" style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}>
        <GlassSurface width={84} height={40} borderRadius={999}>
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-0.5 rounded-full pr-2 pl-1 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            <ChevronLeft size={15} />
            返回
          </button>
        </GlassSurface>
      </div>

      {/* 标题：大号衬线日期 */}
      <header className="px-1 pb-8 pt-10">
        <p className="text-[11px] font-medium tracking-[0.45em] text-brand-ink uppercase">
          {MONTHS_EN[parsed.getMonth()]} · {yearOf(date)}
        </p>
        <div className="mt-2 flex items-baseline gap-3.5">
          <h1 className="font-serif text-[3.4rem] leading-none text-ink">{dayNumber}</h1>
          <div className="pb-0.5">
            <p className="font-serif text-lg leading-snug text-ink-2">{monthLabel(date)}</p>
            <p className="text-xs leading-snug text-ink-3">{weekdayOf(date)}</p>
          </div>
        </div>
        {entries.length > 0 && (
          <p className="mt-4 text-sm text-ink-2">
            {entries.length} 笔{dominant ? ` · 心情多半「${dominant.label}」` : ''}
          </p>
        )}
      </header>

      {/* 时间线：新记录滑入、删除收起，都在这里发生 */}
      {entries.length > 0 ? (
        <div className="flex flex-col gap-2.5 pb-36">
          <AnimatePresence initial={false} mode="popLayout">
            {entries.map(entry => {
              const mood = moodOf(entry.mood)
              const isEditing = entry.id === editingId
              return (
                <motion.article
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.24, ease: EASE }}
                  className={cn(
                    'card cursor-pointer rounded-2xl px-4 py-3.5',
                    isEditing && 'border-brand-ink/40 ring-1 ring-brand',
                  )}
                  onClick={() => !isEditing && startEdit(entry)}
                >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs tabular-nums text-ink-3">
                    {formatClock(entry.time)}
                  </span>
                  {mood && (
                    <span className="flex items-center gap-1.5 text-xs text-ink-2">
                      <MoodFace mood={entry.mood!} className="w-5 shrink-0" />
                      {mood.label}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-0.5">
                    <button
                      type="button"
                      className="btn-ghost size-7"
                      aria-label="编辑这条"
                      onClick={event => {
                        event.stopPropagation()
                        startEdit(entry)
                      }}
                    >
                      <PenLine size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost size-7"
                      aria-label="删除这条"
                      onClick={event => {
                        event.stopPropagation()
                        setConfirmId(entry.id)
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </span>
                </div>
                <p className="mt-2 text-[15px] leading-[1.85] whitespace-pre-wrap text-ink">
                  {entry.text}
                </p>
              </motion.article>
              )
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center pb-44">
          <p className="text-sm text-ink-3">还没有写下这一天的第一笔</p>
        </div>
      )}

      {/* 底部玻璃记录条（避开手势条：--safe-bottom 见 index.css） */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4"
        style={{ paddingBottom: 'calc(1rem + var(--safe-bottom))' }}
      >
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={22}
          className="pointer-events-auto max-w-[408px]"
        >
          <div className="w-full px-2 pt-1 pb-1.5">
            <div className="flex items-center gap-3">
              <MoodPicker value={mood} onChange={setMood} />
              <span className="ml-auto flex items-center gap-2 text-xs tabular-nums text-ink-3">
                {editingEntry ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="btn-ghost size-5"
                      aria-label="取消编辑"
                    >
                      <X size={13} />
                    </button>
                    <span className="flex items-center gap-1.5">
                      <PenLine size={12} />
                      {formatClock(editingEntry.time)}
                    </span>
                  </>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Clock3 size={12} />
                    {formatClock(new Date(now).toISOString())}
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1 flex items-end gap-2">
              <textarea
                ref={textRef}
                value={text}
                onChange={event => setText(event.target.value)}
                onKeyDown={event => {
                  // Enter 记一笔，Shift+Enter 换行；编辑时同理
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    save()
                  }
                }}
                rows={1}
                placeholder={editingEntry ? '修改这一笔…' : '记下这一刻…'}
                className="max-h-40 min-h-11 flex-1 bg-transparent py-2.5 text-[15px] leading-relaxed text-ink placeholder:text-ink-3 focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              />
              <button
                type="button"
                onClick={save}
                disabled={!text.trim()}
                className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 hover:opacity-85 active:scale-90 disabled:opacity-25"
                style={{ backgroundColor: 'var(--brand-ink)' }}
                aria-label={editingEntry ? '保存修改' : '记下这一笔'}
              >
                {editingEntry ? <Check size={16} /> : <ArrowUp size={16} />}
              </button>
            </div>
          </div>
        </GlassSurface>
      </div>

      <GradualBlur position="top" height="3.5rem" strength={1.6} divCount={3} className="z-20" />

      <ConfirmDialog
        open={confirmId !== null}
        title="删掉这一笔？"
        body={
          pendingDelete ? (
            <span>「{pendingDelete.text.slice(0, 24)}…」会连同它的时刻与心情一起删除。</span>
          ) : undefined
        }
        confirmLabel="删除"
        onConfirm={() => {
          if (confirmId) {
            if (confirmId === editingId) cancelEdit()
            onDeleteEntry(confirmId)
          }
          setConfirmId(null)
        }}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
