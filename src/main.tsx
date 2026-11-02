import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import '@/index.css'
import App from '@/App'

// Capacitor 全屏（edge-to-edge）下 WebView 常常不上报 safe-area 的 env()，
// 按原生平台补一个保守的兜底值：状态栏 ≈34px、手势条 ≈20px，
// CSS 里与 env() 取较大者（见 index.css 的 --safe-top / --safe-bottom）。
if (Capacitor.isNativePlatform()) {
  document.documentElement.style.setProperty('--native-safe-top', '34px')
  document.documentElement.style.setProperty('--native-safe-bottom', '20px')
}

// 刻意不包 <StrictMode>：它的「双挂载」会与 motion 的 AnimatePresence 转场
// 在开发模式下冲突（退场动画中断，旧页面残留在 DOM 里盖住新页面）。

createRoot(document.getElementById('root')!).render(<App />)
