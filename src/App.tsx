import { useEffect, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import type { Variants } from 'motion/react'
import Background from '@/components/Background'
import DiaryDayScreen from '@/screens/DiaryDay'
import DiaryList from '@/screens/DiaryList'
import Settings from '@/screens/Settings'
import { EASE } from '@/lib/animation'
import { clearDays, loadDays, removeEntry, saveDays, upsertEntry } from '@/lib/store'
import type { DiaryDay, DiaryEntry } from '@/lib/types'

type Route = { name: 'list' } | { name: 'day'; date: string } | { name: 'settings' }

/** 页面层级：决定转场方向（往深层推 → 从右滑入；返回 → 从左滑回） */
const DEPTH: Record<Route['name'], number> = { list: 0, day: 1, settings: 1 }

function routeKey(route: Route): string {
  return route.name === 'day' ? `day-${route.date}` : route.name
}

const screenVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 44 : -44, zIndex: dir >= 0 ? 2 : 1 }),
  center: { opacity: 1, x: 0, zIndex: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir >= 0 ? -28 : 28, zIndex: dir >= 0 ? 1 : 2 }),
}

export default function App() {
  const [days, setDays] = useState<DiaryDay[]>(loadDays)
  const [route, setRoute] = useState<Route>({ name: 'list' })
  const [direction, setDirection] = useState(1)

  // 数据变化即落盘（localStorage）
  useEffect(() => {
    saveDays(days)
  }, [days])

  function navigate(next: Route) {
    setDirection(DEPTH[next.name] >= DEPTH[route.name] ? 1 : -1)
    setRoute(next)
  }

  let content: React.ReactNode
  if (route.name === 'day') {
    const date = route.date
    const day = days.find(item => item.date === date) ?? null
    content = (
      <DiaryDayScreen
        date={date}
        day={day}
        onBack={() => navigate({ name: 'list' })}
        onSaveEntry={(entry: DiaryEntry) => setDays(prev => upsertEntry(prev, date, entry))}
        onDeleteEntry={(id: string) => setDays(prev => removeEntry(prev, date, id))}
      />
    )
  } else if (route.name === 'settings') {
    content = (
      <Settings
        days={days}
        onBack={() => navigate({ name: 'list' })}
        onClearAll={() => {
          clearDays()
          setDays([])
        }}
      />
    )
  } else {
    content = (
      <DiaryList
        days={days}
        onOpenDay={date => navigate({ name: 'day', date })}
        onOpenSettings={() => navigate({ name: 'settings' })}
      />
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <Background />
      {/* 页面转场：方向感知的推入 / 返回（系统开启减弱动效时自动退化为淡入淡出） */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={routeKey(route)}
          custom={direction}
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.32, ease: EASE }}
          style={{ width: '100%' }}
          className="relative"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}
