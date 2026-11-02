/** 极简确认框：半透明遮罩 + 一张轻玻璃卡片。 */
import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = '删除',
  cancelLabel = '取消',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="card w-full max-w-[320px] rounded-2xl p-5"
        style={{ background: 'var(--card-strong)' }}
        onClick={event => event.stopPropagation()}
      >
        <h3 className="text-[15px] font-medium">{title}</h3>
        {body && <div className="mt-1.5 text-sm leading-relaxed text-ink-2">{body}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm text-ink-2 transition-colors hover:bg-brand-soft hover:text-ink"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-85"
            style={{ backgroundColor: danger ? '#b25b5b' : 'var(--brand-ink)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
