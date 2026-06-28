# DESIGN_SYSTEM.md

## 0. Purpose

本文件定义 `nobli_lovable_v1` 的视觉设计系统，服务于当前这个研究工作台 / agent workspace 前端。

本文件只约束前端视觉表达，不约束业务逻辑，不授权改动路由结构，也不决定页面必须是一栏、两栏还是三栏。

本文件适用于当前项目中的主要界面模块：
- `Sidebar`
- `ProcessBar`
- `HomeScreen`
- `AgentStream`
- `DetailPanel`
- `FinalPaperViewer`
- `cards.tsx` 中的各类输出卡片

本文件控制：
- 视觉语言
- 字体与层级
- 颜色 token
- 间距与圆角
- 卡片、面板、输入区、标签、状态
- 动效与 AI 活跃态
- 可访问性
- 视觉反模式

本文件不控制：
- 页面信息架构
- 业务流程
- 后端接口设计
- 路由和数据流重构

## 1. Product Context

这个项目不是营销官网，也不是通用 BI dashboard。它是一个严肃的研究工作台，围绕以下体验组织：
- 研究任务输入
- agent 时间线推进
- 文献 / 机会 / 实验 /写作 / 投稿输出
- 人类审批节点
- 右侧论文预览与导出

因此视觉上必须服务于：
- 长文本阅读
- 研究摘要浏览
- 结构化证据展示
- agent 状态感知
- 人机协作确认

## 2. Design Direction

整体气质应当是：
- calm
- academic
- precise
- minimal
- premium
- trustworthy
- focused
- quietly agentic

界面应该像“安静、克制、可信的研究工作空间”，而不是：
- 通用 AI SaaS 模板
- 彩色 dashboard
- 带强营销感的 landing page
- 霓虹赛博 AI 产品

## 3. Core Principles

### 3.1 Scholar-Centric Minimalism

以纯净、稳定的实体背景为主，不用大面积全局渐变做主视觉。

要求：
- 主背景以 solid canvas 为主
- pastel 颜色只做局部强调
- 阴影柔和，不要硬投影
- 图标默认单色
- 优先可读性，而不是装饰性

### 3.2 Context over Clutter

信息分层主要靠：
- 字号
- 字重
- 留白
- 表面层级
- 轻边框

不要靠：
- 强装饰
- 高饱和配色
- 每个模块都一样重

### 3.3 Whispering Interactions

交互应该轻、稳、软，不花哨。

要求：
- hover 用微小位移、透明度、背景变化
- active AI / voice / progress 才允许局部 glow
- 不用弹跳、果冻、强闪烁
- 动效服务确认感，不服务炫技

## 4. Typography

### 4.1 Font Families

本项目建议统一为：

```css
:root {
  --font-ui: "Poppins", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-body: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, monospace;
}
```

### 4.2 Usage

`--font-ui` 用于：
- 产品名
- 导航
- 标签
- button
- 状态 pill
- 小型 UI 标题

`--font-body` 用于：
- 时间线 summary
- 研究解释
- 输出卡片正文
- 抽象、实验说明、会议说明
- 论文正文类内容

`--font-mono` 用于：
- JSON 预览
- Tool input/output
- LaTeX
- 代码块
- 终端式内容

### 4.3 Type Scale

```css
:root {
  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --text-3xl: 40px;
  --text-hero: clamp(48px, 8vw, 96px);

  --line-height-tight: 1.12;
  --line-height-normal: 1.5;
  --line-height-reading: 1.65;
}
```

项目内具体要求：
- `HomeScreen` 的主标题应保持 calm、tight、clear
- `AgentStream` 的 step 标题比 summary 高半级，不可过重
- `FinalPaperViewer` 的论文预览必须优先阅读舒适度
- `DetailPanel` 中的 section label 适合小号 uppercase
- 不要把正文全大写

## 5. Color System

### 5.1 Canonical Palette

设计基准色如下：

```css
:root {
  --bg-main: #F7F7F7;
  --bg-soft: #F1F5F9;

  --surface-card: rgba(255, 255, 255, 0.86);
  --surface-card-solid: #FFFFFF;
  --surface-subtle: rgba(248, 250, 252, 0.82);
  --surface-hover: rgba(172, 206, 234, 0.16);

  --border-subtle: rgba(15, 23, 42, 0.06);
  --border-medium: rgba(15, 23, 42, 0.10);

  --brand-blue: #ACCEEA;
  --brand-orange: #FF9270;
  --brand-yellow: #FFE989;
  --brand-mint: #E0F2F1;

  --gradient-progress: linear-gradient(to right, #ACCEEA, #FF9270, #FFE989, #E0F2F1);

  --text-main: #010101;
  --text-muted: #64748B;
  --text-soft: #94A3B8;
  --text-inverse: #F8FAFC;
}
```

### 5.2 Mapping to Current Project Tokens

当前项目已经在 `src/styles.css` 中使用了以下 token 语义，后续视觉调整应优先沿用这些名字，避免全量重命名：

```css
:root {
  --background;
  --foreground;
  --surface;
  --surface-2;
  --card;
  --border;
  --border-strong;
  --ink;
  --ink-muted;
  --success;
  --warning;
  --running;
  --sidebar;
  --sidebar-accent;
}
```

推荐对应关系：
- `--bg-main` -> `--background`
- `--surface-card` / `--surface-card-solid` -> `--card`
- `--surface-subtle` -> `--surface` / `--surface-2`
- `--text-main` -> `--foreground` / `--ink`
- `--text-muted` -> `--ink-muted`
- `--border-subtle` -> `--border`
- `--border-medium` -> `--border-strong`

### 5.3 Usage Rules

使用规则：
- 背景保持中性浅色，避免彩色大底
- 蓝色用于 calm active state、selected state、focus
- 橙色用于 review / revision / warm emphasis
- 黄色用于探索、旁注、轻提醒
- 薄荷绿用于 success / completion / confirmation
- 渐变仅用于 progress、AI active、voice active 的局部状态

禁止：
- 整页 rainbow gradient
- 紫蓝霓虹作为默认品牌感
- 单个组件堆太多 accent color
- 用颜色单独表达状态

## 6. Radius, Border, Shadow

### 6.1 Radius

```css
:root {
  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 999px;
}
```

项目落地建议：
- chips / pills：`--radius-pill`
- 小按钮、小块选择器：`--radius-sm`
- 输出卡片：`--radius-md`
- 大面板、侧栏、输入容器：`--radius-lg`

### 6.2 Borders

要求：
- 优先细边框
- 用边框辅助层级，不抢主视觉
- 不要使用黑色重描边

### 6.3 Shadows

```css
:root {
  --shadow-soft: 0 12px 40px rgba(15, 23, 42, 0.06);
  --shadow-floating: 0 20px 60px rgba(15, 23, 42, 0.10);
  --shadow-quiet: 0 4px 16px rgba(15, 23, 42, 0.04);
}
```

要求：
- 大部分卡片用 `quiet` 或更弱
- 浮层、右键、抽屉、对话框才允许更高 elevation
- 不用硬边、黑压压的阴影

## 7. Spacing Rhythm

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

要求：
- `HomeScreen` 的输入区和示例任务之间要有明显呼吸感
- `AgentStream` 每个 step 内部信息要紧凑，step 与 step 之间要留出层次
- `FinalPaperViewer` 的操作条、tabs、正文层级要清晰，不拥挤
- 不要所有模块使用相同间距，层级感必须由 spacing 拉开

## 8. Component Rules

### 8.1 Sidebar

适用组件：`Sidebar`

规则：
- 侧栏作为 quiet navigation surface
- 选中项可以用轻背景和更高文字对比度表示
- 图标默认单色
- 不把侧栏做成营销 banner
- `Current task` 和 `Task history` 是信息块，不是 feature cards

### 8.2 Top Process Bar

适用组件：`ProcessBar`

规则：
- 是工作流导航，不是炫耀型 progress dashboard
- 进度条 / stage line 要薄、克制
- 当前 stage 明确，未完成 stage 保持轻量
- credits、elapsed、status 是辅助信息，不可压过主流程

### 8.3 Task Input Surface

适用组件：`HomeScreen`

规则：
- 输入区要像可信的 research task composer
- placeholder 清晰，不搞 flashy prompt box
- 图标默认单色
- send action 清楚，但不夸张
- mode pills 应安静、可点、非营销化

### 8.4 Timeline Step

适用组件：`AgentStream`

规则：
- 时间线 step 是核心内容容器
- stage tint 只能做轻底色和 ring，不可饱和大片上色
- title > summary > metadata 的层级必须稳定
- gate 状态需要清楚，但不能变成警报 UI
- 工具入口要像“可展开的执行证据”，不是 promo button

### 8.5 Output Cards

适用组件：`cards.tsx`

规则：
- 卡片服务内容，不服务装饰
- 一张卡片内层级顺序优先是：label -> title -> summary -> evidence -> actions
- 文献卡、机会卡、实验卡、会议卡都要保持“研究证据感”
- 避免所有卡都一样重
- 表格和指标块可以紧凑，但必须保持呼吸感

### 8.6 Status Pills

适用组件：
- step status
- tool status
- approval / review 状态

推荐状态：
- `running`
- `done`
- `waiting for human`
- `needs review`
- `error`
- `ready`

规则：
- pill 以中性底为主
- success / review / waiting 使用低饱和语义底色
- 不要高亮得像告警灯

### 8.7 Source Chips and Citation Chips

规则：
- source 应尽量具体
- citation 要有“证据感”
- chip 应轻而可信
- 不要五颜六色

### 8.8 Tool Blocks

适用组件：
- `Tool · ...` 入口
- `DetailPanel`

规则：
- 工具块是执行证据，不是功能卖点卡片
- selected 态可用轻蓝边框或淡蓝底
- hover 只允许轻微抬升或背景变化
- 详情区中的 JSON / input / output 必须用 mono 风格稳定展示

### 8.9 Final Paper Viewer

适用组件：`FinalPaperViewer`

规则：
- 右侧区域应像“文稿工作台”，不是炫技预览器
- tabs 明确但安静
- 论文页必须优先可读性
- 操作按钮要低噪声
- PDF / LaTeX / Paper 三个视图应保持同一系统下的克制感

### 8.10 Detail Panel

适用组件：`DetailPanel`

规则：
- 高密度但可读
- section label 清楚
- JSON 预览使用深色 mono 容器
- 不把 detail 面板做成装饰卡片堆叠

## 9. Stage Tint Rules

当前项目已经有 `stage-0` 到 `stage-6` 的色板。

要求：
- 保留“每个阶段有轻微色偏”的思路
- 只允许低透明度底色
- ring / ink 可以比底色更明确
- 阶段色用于区分流程上下文，不用于制造彩虹感

阶段色应表现为：
- stage 0: warm exploration
- stage 1: calm literature blue
- stage 2: idea / design violet-pink, but muted
- stage 3: success-green iteration
- stage 4: revision-orange
- stage 5: publication purple, low saturation
- stage 6: memory teal

## 10. Motion and AI Active State

### 10.1 Motion Tokens

```css
:root {
  --motion-fast: 140ms;
  --motion-normal: 220ms;
  --motion-slow: 420ms;
  --motion-breathing: 3600ms;

  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-soft: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### 10.2 Motion Rules

要求：
- hover / selected 用短过渡
- AI active / voice active 用慢呼吸动效
- 优先 opacity、transform、blur
- 避免 layout shift
- 避免 bounce、spin、elastic

### 10.3 AI Glow Rules

允许使用 glow 的地方：
- listening
- active reasoning
- in-progress generation
- progress emphasis

禁止：
- 每张卡都有 glow
- 长文本阅读区一直发光
- neon 风格 glow

如果使用 aurora glow：
- 只能局部
- opacity 很低
- 节奏要慢
- 不应干扰阅读

## 11. Icons

规则：
- 默认单色
- 使用 `text-main`、`text-muted` 或轻蓝 active
- 渐变图标只给 AI active / voice active / progress active

避免把这些当作主品牌符号：
- sparkles
- robot
- rocket
- brain
- glowing orb

优先图标语义：
- document
- citation
- tool
- progress
- review
- search
- export
- upload
- microphone

## 12. Accessibility

必须满足：
- 正文对比度充足
- 状态不能只靠颜色
- focus-visible 清楚
- 支持 reduced motion
- 密集研究面板里不能出现过小难读文字

建议 focus 样式：

```css
:focus-visible {
  outline: 2px solid var(--brand-blue);
  outline-offset: 3px;
}
```

建议 reduced motion：

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 13. Visual Anti-Patterns

禁止：
- 通用 AI SaaS 视觉
- 紫蓝霓虹主视觉
- 发光球、粒子、3D blob
- dashboard 模板感
- 每张卡一样重
- 无依据的装饰卡
- 过度 glassmorphism
- 过亮 code syntax
- 营销型 hero 塞进产品工作台
- 与用户动作无关的假输出卡片

应使用：
- 实体安静背景
- 内容驱动卡片
- 轻边框
- 柔阴影
- pastel 局部强调
- source chips
- citation chips
- status pills
- selected state
- readable detail panel
- quiet visible agent activity

## 14. Implementation Guidance

对这个仓库的执行原则：

1. 保留现有信息架构和工作台布局，除非用户明确要求重构布局。
2. 优先在 `src/styles.css` 内统一 token，不要散落硬编码颜色。
3. 新增组件时复用当前 token 语义：`background`、`surface`、`card`、`border`、`ink-muted`、`stage-*`。
4. 新视觉应优先提升研究感和可信度，而不是“更像 AI 产品”。
5. 长文本可读性优先于视觉噱头。
6. 交互反馈应轻、稳、安静。
7. 不因设计系统而改业务逻辑。
8. 不因设计系统而改路由结构。

## 15. Final Quality Bar

这个项目的 UI 成功标准是：
- 更安静
- 更学术
- 更可信
- 更像研究工作台
- 更少模板味
- 更少 dashboard 感
- 更少 marketing 感
- 更适合长时间阅读、思考、审阅与确认

如果一个改动让界面更像“通用 AI 产品模板”，那它违背了本设计系统。
