import { useEffect, useState } from 'react'
import Background from '@/components/Background'
import DiaryDayScreen from '@/screens/DiaryDay'
import DiaryList from '@/screens/DiaryList'
import { loadDays, removeEntry, saveDays, upsertEntry } from '@/lib/store'
import type { DiaryDay, DiaryEntry } from '@/lib/types'

type Route = { name: 'list' } | { name: 'day'; date: string }

export default function App() {
  const [days, setDays] = useState<DiaryDay[]>(loadDays)
  const [route, setRoute] = useState<Route>({ name: 'list' })

  // 数据变化即落盘（localStorage）
  useEffect(() => {
    saveDays(days)
  }, [days])

  if (route.name === 'day') {
    const date = route.date
    const day = days.find(item => item.date === date) ?? null
    return (
      <>
        <Background />
        <div key={date} className="screen">
          <DiaryDayScreen
            date={date}
            day={day}
            onBack={() => setRoute({ name: 'list' })}
            onSaveEntry={(entry: DiaryEntry) => setDays(prev => upsertEntry(prev, date, entry))}
            onDeleteEntry={(id: string) => setDays(prev => removeEntry(prev, date, id))}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <Background />
      <div key="list" className="screen">
        <DiaryList days={days} onOpenDay={date => setRoute({ name: 'day', date })} />
      </div>
    </>
  )
}
