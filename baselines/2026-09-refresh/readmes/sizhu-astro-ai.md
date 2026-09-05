# MingXu / 命序

**A deterministic BaZi, Zi Wei Dou Shu, Da Liu Ren, transit and true-solar-time computation workspace for humans and AI agents.**

MingXu (命序) computes BaZi (Four Pillars), Zi Wei Dou Shu, transit structures, apparent solar time, and complete Da Liu Ren charts with code. AstroCopy remains the internal calculation-engine identity; the public Agent namespace is `mingxu.*`.

The core product idea is simple:

> **Computation belongs to a deterministic engine. Interpretation belongs to the user and the AI they choose.**

- Live app: <https://astrocopy.jackmeds.top/>
- AI discovery page: <https://astrocopy.jackmeds.top/agent/>
- Source: <https://github.com/JackMeds/sizhu-astro-ai>
- Agent guide: <https://astrocopy.jackmeds.top/agents.md>
- Guides: <https://astrocopy.jackmeds.top/guide/> · <https://astrocopy.jackmeds.top/guide/late-zi-hour.html> · <https://astrocopy.jackmeds.top/guide/shichen-boundary.html> · <https://astrocopy.jackmeds.top/guide/true-solar-time-impact.html> · <https://astrocopy.jackmeds.top/guide/ziwei-software-differences.html> · <https://astrocopy.jackmeds.top/guide/liuren-transmission-example.html> · <https://astrocopy.jackmeds.top/guide/ai-bazi-analysis.html>
- Remote MCP (deployment target): `https://mcp.jackmeds.top/mcp`

## Why MingXu exists

Large language models can discuss traditional metaphysics, but they are unreliable at repeatedly calculating calendars, pillars, luck cycles, time corrections, palace structures, and Da Liu Ren transmissions from conversational context alone.

MingXu separates the problem into two layers:

```text
Birth or casting input
        ↓
Explicit civil-time and solar-time semantics
        ↓
Deterministic BaZi / Zi Wei / Da Liu Ren computation
        ↓
Stable structural facts, warnings and cross-check evidence
        ↓
A shared browser workspace for a person and an AI agent
        ↓
Optional interpretation by the AI selected by the user
```

The website itself does not claim scientific predictive validity and does not replace medical, legal, financial, or other professional advice.

## Human–agent workspace

MingXu is not only a JSON endpoint embedded in a page. WebMCP actions use the same reducer and visible state as human interactions.

An agent can:

- create a birth chart and make it appear in the current page;
- open the BaZi, Zi Wei, transit, comparison, or audit view;
- select a target transit date;
- compare two to five dates in the visible workspace;
- manually select, pin, or unpin a comparison date without leaving the workspace;
- read the current user-selected and pinned state plus recent human/Agent activity;
- leave a visible activity record that the user can inspect or undo.

The user can then change the selected view or date manually, and the agent reads that updated state on its next call.

### WebMCP tool surface

The challenge workspace uses a small task-oriented surface rather than exposing every internal function:

- `mingxu.create_birth_chart`
- `mingxu.get_transit_snapshot`
- `mingxu.compare_transits`
- `mingxu.ui.inspect_chart`
- `mingxu.ui.inspect_transit`
- `mingxu.ui.compare_transits`
- `mingxu.ui.get_workspace_state`
- Da Liu Ren tools are registered only when that workspace is relevant.

The Zi Wei inspection contract uses stable semantic `focusIds`, for example
`["ziwei-palace-life", "ziwei-palace-body"]`. Transit comparison uses the single
canonical input field `targetDates`.

Invalid tool inputs return `isError: true` and do not mutate the workspace. Undo is
field-aware: reverting an older Agent comparison restores its comparison set without
overwriting a newer human selection or pin.

The production browser test also creates charts with New York daylight saving time,
India's 30-minute offset, and Kathmandu's 45-minute offset, and rejects a nonexistent
New York DST-gap wall time without replacing the current chart.

The existing local stdio MCP server remains available for clients such as Codex and other MCP-compatible desktop tools. The same calculation registry is also exposed through the deployment-ready stateless Streamable HTTP handler.

## Core capabilities

### BaZi · Four Pillars

- year, month, day, and hour pillars;
- Heavenly Stems, Earthly Branches, Ten Gods, hidden stems, Na Yin, and void branches;
- 10-year luck cycles, annual transits, and monthly transits;
- deterministic structural relations including combinations, clashes, harms, breaks, punishments, self-punishments, Fu Yin, and Three-Harmony / Three-Meeting candidates;
- transformation is marked only as a candidate at the fact layer;
- overlapping calendrical fields are cross-checked with `lunisolar`.

### Zi Wei Dou Shu

- Life and Body Palaces, Soul and Body Stars, and Five-Phase Class;
- normalized twelve-palace data;
- major, minor, and supporting stars;
- brightness, natal transformations, decadal ranges, and dynamic scopes;
- an original AstroCopy renderer built from normalized data rather than the default `react-iztro` visual component.

### Transit workspace

For one target date, AstroCopy combines:

- the matching BaZi 10-year cycle and annual transit;
- deterministic relations between the natal chart, cycle, and year;
- Zi Wei decadal, nominal-age, annual, monthly, daily, and hourly scopes.

The comparison workspace can keep several dates visible at the same time for human–agent review.

### Complete Da Liu Ren

Three casting entries are supported:

- actual-time casting;
- reported-number casting, cyclically mapped with 1=Zi through 12=Hai;
- direct hour-branch selection.

The normalized result includes:

- Month General;
- Earth and Heaven plates;
- Twelve Generals;
- Four Lessons;
- Three Transmissions selected through the applicable Nine-School rule;
- void branches, hidden stems, Six Relations, transmission pattern, chart forms, and source-gated Shen-Sha;
- overlap checks between two TypeScript engines;
- pinned Python `kinliuren` fixtures as an additional CI oracle.

## International time semantics

The challenge branch supports IANA time zones and date-specific UTC offsets, including daylight-saving transitions and non-hour offsets.

Examples covered by tests include:

- `Asia/Shanghai`;
- `America/Los_Angeles` in standard and daylight time;
- `America/New_York`;
- `Europe/London`;
- `Asia/Kolkata`;
- ambiguous or nonexistent local wall times around DST transitions.

Three calculation bases are retained explicitly:

1. standard civil time;
2. local mean solar time using longitude correction;
3. apparent solar time using longitude correction plus the equation of time.

The output records the effective basis, correction in minutes, and whether the correction crossed an hour branch or calendar date.

## Bilingual product

The application supports Simplified Chinese and English.

English terminology preserves the source tradition instead of pretending it is Western astrology. For example:

- `八字` → **BaZi · Four Pillars**
- `天干` → **Heavenly Stems**
- `地支` → **Earthly Branches**
- `十神` → **Ten Gods**
- `大运` → **10-year Luck Cycle**
- `流年` → **Annual Transit**
- `真太阳时` → **Apparent Solar Time**
- `大六壬` → **Da Liu Ren**

Chinese characters remain visible where they carry the actual chart data, while navigation, explanations, accessibility labels, errors, activity records, and AI export instructions follow the selected language.

## Privacy model

Birth-chart and casting computation runs in the browser. Drafts and history are stored in the current browser unless the user exports or shares them.

AstroCopy does not automatically send birth data to ChatGPT, Claude, Gemini, DeepSeek, Kimi, or another model. When a user explicitly invokes a WebMCP tool or pastes an export into an AI service, the returned chart data is processed under that service's terms.

## Validation architecture

- `lunar-javascript@1.7.7`: BaZi, luck cycles, solar terms, and calendrical bridge;
- `iztro`: Zi Wei calculation and dynamic scopes;
- `lunisolar`: overlapping BaZi calendrical cross-check;
- `mingyu-core@0.1.23`: complete Da Liu Ren engine and second TypeScript implementation;
- `kentang2017/kinliuren` pinned at commit `3ba45a9540f08269b56d81508a061c7d46938785`: executable Python CI oracle.

Differences are not silently discarded. They are returned in warnings or `crossCheck.differences` and shown in the calculation-audit UI.

## Repository structure

```text
apps/web                 React + Vite bilingual web workspace
apps/mcp                 Local stdio MCP server
packages/core            Time, BaZi, Zi Wei, transit, relation and Da Liu Ren core
packages/prompt          Structured AI export logic
packages/render          SVG and rendering helpers
tools/liuren-reference   Pinned Python oracle adapter
```

## Local development

Requirements:

- Node.js 24
- npm

```bash
npm install
npm run dev:web
```

Open the local URL printed by Vite.

## Remote MCP

`apps/mcp` keeps the local stdio server and also exposes a stateless Streamable HTTP handler for Vercel. The deployment-ready routes are `/mcp` and `/health`; see [docs/remote-mcp.md](docs/remote-mcp.md) for local testing and custom-domain setup. The public metadata candidate is [server.json](server.json).

## Tests and builds

```bash
npm run test
npm run typecheck
npm run build:mcp
npm run build:web
```

CI validates core fixtures, relation facts, time-zone behavior, Zi Wei normalization, transit snapshots, prompt output, MCP compilation, web compilation, and the pinned Da Liu Ren oracle.

## Current product boundary

AstroCopy computes and structures chart evidence. It deliberately does **not**:

- assert that traditional metaphysics is modern science;
- silently choose a school-specific interpretation as objective fact;
- alter computed pillars or palace data to fit a narrative;
- provide medical, legal, financial, or other professional decisions;
- require an account or lock the user to one AI provider.

---

# 中文说明

**AstroCopy 四柱星盘** 是一个本地优先、确定性优先、中英双语的传统术数工作台。程序负责计算八字、紫微斗数、运限、真太阳时和完整大六壬；用户与支持 WebMCP 的 Agent 可以共同操作同一张网页命盘。

项目的核心不是“让 AI 自己手算命盘”，而是：

> **把历法和排盘交给可复现代码，把解释交给用户选择的 AI。**

当前主要能力包括：

- 八字四柱、十神、藏干、纳音、空亡和五行结构；
- 大运、流年、流月；
- 冲、合、刑、害、破、伏吟、三合/三会候选等确定性关系事实；
- 紫微十二宫、星曜、亮度、四化、大限和动态运限；
- 原创紫微命盘前端，不再直接使用开源组件默认视觉；
- 全球 IANA 时区、夏令时和真太阳时；
- 正时、报数、指定占时三种大六壬起课入口；
- 天地盘、天将、四课、三传、旬空、遁干、六亲、课体和来源受控神煞；
- WebMCP 共享状态、页面联动、比较视图、操作记录和撤销；
- 本地 stdio MCP、Markdown / 纯文本 / JSON 导出。

网页默认不上传出生资料。只有用户主动调用 Agent 工具、复制导出内容或发送给第三方 AI 后，相关数据才进入对应服务的处理范围。

本项目用于传统文化研究、工具开发与自我观察。术数解释不等同于现代科学结论，也不替代医学、法律、投资或其他专业判断。
