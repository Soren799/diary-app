export type Mood = 'great' | 'good' | 'ok' | 'low' | 'bad'

/** 日记里的一条记录 —— 一天可以有很多条，每条自带时刻。 */
export interface DiaryEntry {
  id: string
  /** ISO 时间戳，记录生成的那一刻 */
  time: string
  text: string
  mood?: Mood
}

/** 一天的日记：一天一篇，正文由多条记录组成。 */
export interface DiaryDay {
  /** 'YYYY-MM-DD' */
  date: string
  entries: DiaryEntry[]
}
