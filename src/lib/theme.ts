/**
 * 主题状态：light / dark。
 * 首选记忆的上次选择，没有就跟随系统；切换时把 .dark 挂到 html 上，
 * 全站的语义 token（--paper / --ink / ...）跟着翻转。
 * 玻璃件（GlassSurface）也要跟着换渲染分支，所以暴露一个可订阅的 hook。
 */
import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark'

const KEY = 'diary.theme'

function initial(): ThemeMode {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* 隐私模式等拿不到 localStorage，跟随系统即可 */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let mode: ThemeMode = initial()

const listeners = new Set<() => void>()

function apply(): void {
  document.documentElement.classList.toggle('dark', mode === 'dark')
}

// 模块加载即生效，避免首帧闪错主题
apply()

export function getTheme(): ThemeMode {
  return mode
}

export function setTheme(next: ThemeMode): void {
  if (next === mode) return
  mode = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* 忽略 */
  }
  apply()
  listeners.forEach(listener => listener())
}

export function toggleTheme(): void {
  setTheme(mode === 'dark' ? 'light' : 'dark')
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useTheme(): ThemeMode {
  return useSyncExternalStore(subscribe, getTheme)
}
