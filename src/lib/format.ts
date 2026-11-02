const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'] as const

const pad = (n: number) => String(n).padStart(2, '0')

/** 'YYYY-MM-DD' */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 今天的 'YYYY-MM-DD' */
export function todayKey(): string {
  return dateKey(new Date())
}

/** 把 'YYYY-MM-DD' 解析成本地时间的 Date（避免 new Date('2026-09-27') 被当成 UTC） */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function weekdayOf(key: string): string {
  return WEEKDAYS[parseDateKey(key).getDay()]
}

/** '2026-11-01' → 11 */
export function monthOf(key: string): number {
  return parseDateKey(key).getMonth() + 1
}

/** '2026-11-01' → 2026 */
export function yearOf(key: string): number {
  return parseDateKey(key).getFullYear()
}

/** 分组标题：'2026-11-01' → '十一月' */
export function monthLabel(key: string): string {
  const names = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return names[monthOf(key) - 1] ?? ''
}

/** ISO → '14:32' */
export function formatClock(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
