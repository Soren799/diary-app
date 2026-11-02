# 奇想日记 · 安卓 App 原型（Web 版）

手机日记界面的第一版原型：只有日记，没有首页。React 19 + Vite 8 + Tailwind v4，
与 `../网站` 同栈，数据全部存 localStorage（种子数据相对今天生成）。

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # tsc --noEmit && vite build
```

> HMR 暂时关闭（`vite.config.ts` 里 `hmr: false`，原因同网站项目），改完代码手动刷新。

## 已实现

- **浅色 / 深色双主题**：首选跟随系统，可手动切换并记忆（`src/lib/theme.ts`）。
  语义 token 定义在 `src/index.css` 的 `:root` / `.dark` 里（`--paper` / `--ink` / `--brand` …）。
- **玻璃件**：从网站移植的 `GlassSurface`（SVG 位移折射 + backdrop-filter，自动降级），
  已接入主题切换。用在四处：列表顶栏、返回药丸、右下角 FAB、底部记录条。
- **列表页**：按月分组的日卡（衬线大日期 + 心情色点 + 摘要），底部渐进模糊。
- **日记页**：大号衬线日期标题 + 时间线；底部玻璃记录条——心情五档圆点、
  时刻自动取当下、Enter 直接记一笔；点任意记录进入编辑，删除走确认框。

## 数据

`src/lib/store.ts`：localStorage key `diary.days.v1`。想重置示例数据，
控制台执行 `localStorage.removeItem('diary.days.v1')` 后刷新。

## 结构

```
src/
├─ lib/       types / format / mood / theme / store / cn
├─ components/ GlassSurface（玻璃件）GradualBlur Background MoodPicker ConfirmDialog
└─ screens/   DiaryList（列表） DiaryDay（某天的日记 + 记录条）
```

## 下一步（如果要变成真 App）

按 Expo (React Native) 重写壳子：SQLite 换掉 localStorage，NativeWind 直接吃这套
语义 token，玻璃件在 RN 里用 `expo-blur` + 边框高光近似复刻；本仓库的
类型、mood 常量、store 逻辑、页面结构都可以平移。
