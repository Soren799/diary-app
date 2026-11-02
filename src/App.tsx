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
  enter: (dir: number) => ({ opacity: 0, x: dir >= 0 ? 44 : -44, zIndex: 2 }),
  center: { opacity: 1, x: 0, zIndex: 1 },
  // 退场只做快速淡出、不带位移：即使极端情况下退场节点滞留 DOM，
  // 也是一个近乎全透明的不可见层，不会造成视觉堆叠
  exit: { opacity: 0, zIndex: 1, transition: { duration: 0.16, ease: 'linear' } },
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
    // 新页面从顶部打开：列表页滚到一半点进日记，不能带着旧滚动位置
    window.scrollTo({ top: 0 })
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
      {/* 页面转场：方向感知的推入 / 返回，双屏交叠淡入淡出（无空窗闪烁）。
          系统开启减弱动效时自动退化为瞬切。 */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={routeKey(route)}
          custom={direction}
          variants={screenVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.26, ease: EASE }}
          style={{ width: '100%' }}
          className="relative"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}
