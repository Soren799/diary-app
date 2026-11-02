/**
 * 本地数据层 —— 原型阶段没有后端，全部存 localStorage。
 * 表结构与网站 Supabase 的 notes 表（kind='diary'）对齐：
 *   一天一条 DiaryDay，下面挂多条带时间戳与心情的 DiaryEntry。
 * 种子数据相对「今天」生成，保证任何时候打开预览都是最近两周的样子。
 */
import { dateKey } from '@/lib/format'
import type { DiaryDay, DiaryEntry, Mood } from '@/lib/types'

const KEY = 'diary.days.v1'

export function loadDays(): DiaryDay[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedDays()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedDays()
    return parsed as DiaryDay[]
  } catch {
    return seedDays()
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

// ------------------------------------------------------------------ 种子数据

interface SeedSpec {
  offset: number
  entries: { h: number; m: number; mood?: Mood; text: string }[]
}

const SEED: SeedSpec[] = [
  {
    offset: 0,
    entries: [
      {
        h: 8,
        m: 5,
        mood: 'good',
        text: '醒来的时候天刚亮，楼下有鸟叫。磨了一壶咖啡，把窗开了一条缝——风是凉的，不冷，刚刚好。',
      },
    ],
  },
  {
    offset: 1,
    entries: [
      {
        h: 9,
        m: 14,
        mood: 'great',
        text: '方案一次过审。走出会议室的时候阳光正好落在走廊尽头，我突然觉得这个秋天没那么难熬。',
      },
      {
        h: 21,
        m: 40,
        mood: 'ok',
        text: '晚饭后沿河堤走了一段。水面上全是灯的倒影，被风揉碎又拼起来。什么也没想，很好。',
      },
    ],
  },
  {
    offset: 2,
    entries: [
      {
        h: 12,
        m: 2,
        mood: 'ok',
        text: '食堂的番茄牛腩意外地好。隔壁桌在背单词，翻页的声音很轻，像另一种下雨。',
      },
      {
        h: 23,
        m: 5,
        mood: 'low',
        text: '给家里打了个电话，妈妈说院子里的桂花开了。挂了电话有点想家，写给以后的自己看。',
      },
    ],
  },
  {
    offset: 4,
    entries: [
      {
        h: 8,
        m: 30,
        mood: 'ok',
        text: '通勤路上把那本小说读完了。结局留白留得很妙，我在地铁上多坐了两站才反应过来。',
      },
    ],
  },
  {
    offset: 5,
    entries: [
      {
        h: 10,
        m: 15,
        mood: 'bad',
        text: '一早就被线上告警叫醒，忙到下午才算稳住。事情解决了一半，人已经累了。',
      },
      {
        h: 22,
        m: 18,
        mood: 'good',
        text: '洗完澡泡了杯热茶，把白天的事写下来之后，好像也没那么糟。睡吧。',
      },
    ],
  },
  {
    offset: 8,
    entries: [
      {
        h: 15,
        m: 26,
        mood: 'great',
        text: '周末去了美术馆，在一幅很安静的画前站了很久。出门的时候买了张同款色调的明信片。',
      },
    ],
  },
  {
    offset: 11,
    entries: [
      {
        h: 10,
        m: 48,
        mood: 'good',
        text: '把阳台那盆绿萝换了盆。旧盆太小了，根都挤在一起。希望它喜欢新家。',
      },
    ],
  },
]

function seedDays(): DiaryDay[] {
  const now = new Date()
  return SEED.map(spec => {
    const day = new Date(now)
    day.setDate(day.getDate() - spec.offset)
    return {
      date: dateKey(day),
      entries: spec.entries.map(item => ({
        id: uid(),
        time: new Date(day.getFullYear(), day.getMonth(), day.getDate(), item.h, item.m).toISOString(),
        text: item.text,
        mood: item.mood,
      })),
    }
  })
}
