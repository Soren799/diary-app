/**
 * 设置页：外观（浅 / 深切换）+ 数据（导出备份 / 清空全部，双确认）+ 关于。
 * 入口在列表顶栏右上角的 ≡；导航语言与日记页一致（玻璃返回药丸 + 大标题）。
 */
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Trash2 } from 'lucide-react'
import ConfirmDialog from '@/components/ConfirmDialog'
import GlassSurface from '@/components/GlassSurface'
import { todayKey } from '@/lib/format'
import { setTheme, useTheme } from '@/lib/theme'
import type { DiaryDay } from '@/lib/types'
import { cn } from '@/lib/cn'

interface SettingsProps {
  days: DiaryDay[]
  onBack: () => void
  onClearAll: () => void
}

export default function Settings({ days, onBack, onClearAll }: SettingsProps) {
  const theme = useTheme()
  const [confirmStage, setConfirmStage] = useState<0 | 1 | 2>(0)
  const entryCount = days.reduce((sum, day) => sum + day.entries.length, 0)

  /** 导出：能调系统分享（Android 可存到文件/发给自己）就分享，否则退回浏览器下载 */
  function exportBackup() {
    const payload = JSON.stringify(
      { app: 'whim-diary', version: __APP_VERSION__, exportedAt: new Date().toISOString(), days },
      null,
      2,
    )
    const name = `whim-diary-${todayKey()}.json`
    const file = new File([payload], name, { type: 'application/json' })
    if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      void navigator.share({ files: [file], title: '奇想日记备份' }).catch(() => {})
      return
    }
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = name
    anchor.click()
    URL.revokeObjectURL(url)
  }

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

      {/* 标题 */}
      <header className="px-1 pb-8 pt-10">
        <p className="text-[11px] font-medium tracking-[0.45em] text-brand-ink uppercase">Settings</p>
        <h1 className="mt-2.5 font-serif text-[2.6rem] leading-none text-ink">设置</h1>
        <p className="mt-3.5 text-sm text-ink-2">
          {days.length > 0
            ? `${days.length} 天 · ${entryCount} 笔，都只存在这台设备上`
            : '还没有写下任何一笔'}
        </p>
      </header>

      {/* 外观 */}
      <section className="mt-2">
        <h2 className="mb-2.5 px-1 text-[11px] font-medium tracking-[0.3em] text-ink-3 uppercase">
          外观
        </h2>
        <div className="card flex rounded-full p-1" role="radiogroup" aria-label="主题">
          {(['light', 'dark'] as const).map(mode => {
            const selected = theme === mode
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(mode)}
                className={cn(
                  'flex-1 rounded-full py-2 text-sm transition-colors duration-200',
                  selected ? 'bg-brand-soft font-medium text-brand-ink' : 'text-ink-3 hover:text-ink-2',
                )}
              >
                {mode === 'light' ? '浅色' : '深色'}
              </button>
            )
          })}
        </div>
      </section>

      {/* 数据 */}
      <section className="mt-7">
        <h2 className="mb-2.5 px-1 text-[11px] font-medium tracking-[0.3em] text-ink-3 uppercase">
          数据
        </h2>
        <div className="card divide-y divide-line overflow-hidden rounded-2xl">
          <button
            type="button"
            onClick={exportBackup}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px] text-ink transition-colors hover:bg-brand-soft/30"
          >
            <span className="flex items-center gap-2.5">
              <Download size={16} className="text-ink-3" />
              导出备份
            </span>
            <ChevronRight size={16} className="text-ink-3" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmStage(1)}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[15px] transition-colors hover:bg-brand-soft/30"
            style={{ color: '#b25b5b' }}
          >
            <span className="flex items-center gap-2.5">
              <Trash2 size={16} />
              清空全部数据
            </span>
            <ChevronRight size={16} className="text-ink-3" />
          </button>
        </div>
        <p className="mt-2 px-1 text-xs leading-relaxed text-ink-3">
          导出会生成包含全部日记的 JSON 文件；手机上通过系统分享面板保存或发送。
        </p>
      </section>

      {/* 关于 */}
      <section className="mt-7">
        <h2 className="mb-2.5 px-1 text-[11px] font-medium tracking-[0.3em] text-ink-3 uppercase">
          关于
        </h2>
        <div className="card flex items-center justify-between rounded-2xl px-4 py-3.5">
          <div>
            <p className="text-[15px] text-ink">奇想日记</p>
            <p className="mt-0.5 text-xs text-ink-3">把念头留下，剩下的交给时间。</p>
          </div>
          <span className="font-serif text-sm tabular-nums text-ink-3">v{__APP_VERSION__}</span>
        </div>
      </section>

      <div className="h-16" />

      {/* 清空：两道确认 */}
      <ConfirmDialog
        open={confirmStage === 1}
        title="清空全部数据？"
        body={`将删除 ${days.length} 天、共 ${entryCount} 笔日记。导出备份是唯一的后悔药。`}
        confirmLabel="继续"
        onConfirm={() => setConfirmStage(2)}
        onCancel={() => setConfirmStage(0)}
      />
      <ConfirmDialog
        open={confirmStage === 2}
        title="最后确认"
        body="删除后无法找回。确定清空吗？"
        confirmLabel="仍要清空"
        danger
        onConfirm={() => {
          onClearAll()
          setConfirmStage(0)
        }}
        onCancel={() => setConfirmStage(0)}
      />
    </div>
  )
}
