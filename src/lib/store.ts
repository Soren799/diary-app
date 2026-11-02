/**
 * 本地数据层 —— 原型阶段没有后端，全部存 localStorage。
 * 表结构与网站 Supabase 的 notes 表（kind='diary'）对齐：
 *   一天一条 DiaryDay，下面挂多条带时间戳与心情的 DiaryEntry。
 * 首次使用为空白本，不再注入种子数据。
 */
import type { DiaryDay, DiaryEntry } from '@/lib/types'

const KEY = 'diary.days.v2'
const LEGACY_KEY = 'diary.days.v1'

/** v1 时代注入过的种子数据原文 —— 迁移时按文本剔除，用户自己写的内容保留 */
const SEED_TEXTS = new Set([
  '醒来的时候天刚亮，楼下有鸟叫。磨了一壶咖啡，把窗开了一条缝——风是凉的，不冷，刚刚好。',
  '方案一次过审。走出会议室的时候阳光正好落在走廊尽头，我突然觉得这个秋天没那么难熬。',
  '晚饭后沿河堤走了一段。水面上全是灯的倒影，被风揉碎又拼起来。什么也没想，很好。',
  '食堂的番茄牛腩意外地好。隔壁桌在背单词，翻页的声音很轻，像另一种下雨。',
  '给家里打了个电话，妈妈说院子里的桂花开了。挂了电话有点想家，写给以后的自己看。',
  '通勤路上把那本小说读完了。结局留白留得很妙，我在地铁上多坐了两站才反应过来。',
  '一早就被线上告警叫醒，忙到下午才算稳住。事情解决了一半，人已经累了。',
  '洗完澡泡了杯热茶，把白天的事写下来之后，好像也没那么糟。睡吧。',
  '周末去了美术馆，在一幅很安静的画前站了很久。出门的时候买了张同款色调的明信片。',
  '把阳台那盆绿萝换了盆。旧盆太小了，根都挤在一起。希望它喜欢新家。',
])

export function loadDays(): DiaryDay[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as DiaryDay[]) : []
    }

    // v1 时代装过示例数据：剔除种子、保留用户自己写的，迁移到 v2
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      try {
        const parsed: unknown = JSON.parse(legacy)
        const migrated = (Array.isArray(parsed) ? (parsed as DiaryDay[]) : [])
          .map(day => ({ ...day, entries: day.entries.filter(entry => !SEED_TEXTS.has(entry.text)) }))
          .filter(day => day.entries.length > 0)
        localStorage.setItem(KEY, JSON.stringify(migrated))
        localStorage.removeItem(LEGACY_KEY)
        return migrated
      } catch {
        localStorage.removeItem(LEGACY_KEY)
        return []
      }
    }

    return []
  } catch {
    return []
  }
}

export function saveDays(days: DiaryDay[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(days))
  } catch {
    /* 存储满等情况：原型阶段静默忽略 */
  }
}

export function clearDays(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 忽略 */
  }
}

export function dayOf(days: DiaryDay[], date: string): DiaryDay | null {
  return days.find(day => day.date === date) ?? null
}

/** 天按日期倒序；天内记录按时刻正序（时间线从早到晚） */
export function sortedDays(days: DiaryDay[]): DiaryDay[] {
  return [...days]
    .map(day => ({ ...day, entries: [...day.entries].sort(byTime) }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

function byTime(a: DiaryEntry, b: DiaryEntry): number {
  return a.time < b.time ? -1 : a.time > b.time ? 1 : 0
}

/** 新增或更新一条记录（按 id 覆盖）；返回新数组，不改原数组 */
export function upsertEntry(days: DiaryDay[], date: string, entry: DiaryEntry): DiaryDay[] {
  const existing = dayOf(days, date)
  if (!existing) return [...days, { date, entries: [entry] }]
  const entries = existing.entries.some(item => item.id === entry.id)
    ? existing.entries.map(item => (item.id === entry.id ? entry : item))
    : [...existing.entries, entry]
  return days.map(day => (day.date === date ? { ...day, entries: [...entries].sort(byTime) } : day))
}

/** 删除一条记录；删空的那一天整个移除 */
export function removeEntry(days: DiaryDay[], date: string, entryId: string): DiaryDay[] {
  return days
    .map(day =>
      day.date === date
        ? { ...day, entries: day.entries.filter(item => item.id !== entryId) }
        : day,
    )
    .filter(day => day.entries.length > 0)
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
