# GitHub 品牌交付与发布关卡

本轮交付的是可审阅的分支、素材、文档、中央工具和命序迁移代码；不是已上线的账号门面。所有业务变更保留为 Draft PR，没有自动合并，也没有修改头像、Bio、Pins、社交预览设置、线上域名或仓库名称。

## 先看这一组

- [主页实际 README](https://github.com/JackMeds/JackMeds/blob/brand/functional-specimen/README.md) · [主页 PR #1](https://github.com/JackMeds/JackMeds/pull/1)
- [Flowloud 实际 README](https://github.com/JackMeds/flowloud/blob/brand/functional-specimen/README.md) · [Flowloud PR #2](https://github.com/JackMeds/flowloud/pull/2)
- [设计规范](../DESIGN.md) · [中央工具 PR #1](https://github.com/JackMeds/github-brand/pull/1)

本地素材画廊：在品牌仓库运行 `npm run preview`，打开命令输出的本地地址。画廊含 12 组浅深 Hero、社交图和四个试点的真实产品证据。它用于比较素材；README 排版另在 GitHub 实际页面验收。

![主页社交图样张](../assets/examples/JackMeds.png)

![Flowloud 社交图样张](../assets/examples/flowloud.png)

## 独立交付清单

| 交付单元 | Draft PR | 内容与上线条件 |
| --- | --- | --- |
| 中央品牌工具 | [github-brand #1](https://github.com/JackMeds/github-brand/pull/1) | 原创 JM、规范、字体轮廓、生成/只读检查、回退基线、素材画廊 |
| 个人主页 | [JackMeds #1](https://github.com/JackMeds/JackMeds/pull/1) | 精简中英介绍、四个作品条目，移除第三方统计卡；四试点验收后发布 |
| Flowloud / 流声 | [flowloud #2](https://github.com/JackMeds/flowloud/pull/2) | 中英文独立 README、真实扩展工作区、安装入口与下沉技术文档 |
| BiliDigest | [BiliDigest #2](https://github.com/JackMeds/BiliDigest/pull/2) | 最短成功路径、原英文入口、离线真实 CLI/Markdown 输出 |
| 可话花园 | [kehua-memory-garden #1](https://github.com/JackMeds/kehua-memory-garden/pull/1) | 在线入口、导入路径、虚构记录的真实界面、英文摘要 |
| 命序：兼容准备 | [sizhu-astro-ai #12](https://github.com/JackMeds/sizhu-astro-ai/pull/12) | 英文主文＋中文独立版、真实工作台、私有旧包转发、备份导入、旧站恢复 Worker |
| 命序：地址切换 | [sizhu-astro-ai #13](https://github.com/JackMeds/sizhu-astro-ai/pull/13) | 依赖 #12；新仓库/域名引用、CNAME、SEO、Agent 与 MCP 元数据；准备完成后再切换 |
| MakeSoundBook | [#76](https://github.com/JackMeds/MakeSoundBook/pull/76) | 基于 Electron 实际功能的轻量介绍，保留原作者与许可声明 |
| HaoXing | [#14](https://github.com/JackMeds/HaoXing/pull/14) | 前端/BMS/服务端入口与已知部署缺口；独立中英文版 |
| hideplayerheadblock | [#1](https://github.com/JackMeds/hideplayerheadblock/pull/1) | 明示当前只有项目骨架、缺少源码/Wrapper；不虚构可安装产物 |
| kehua-time-machine | [#1](https://github.com/JackMeds/kehua-time-machine/pull/1) | 对 `gh-pages` 默认分支整理；按历史静态构建说明使用方式 |
| Notesharea-server | [#40](https://github.com/JackMeds/Notesharea-server/pull/40) | Koa/MySQL/Redis、配置和数据库边界；未运行数据同步 |
| Notesharea-admin | [#1](https://github.com/JackMeds/Notesharea-admin/pull/1) | 管理端入口、示例图表限制和使用步骤 |
| Notesharea-web | [#47](https://github.com/JackMeds/Notesharea-web/pull/47) | 笔记创作/阅读入口、上传服务边界和使用步骤 |

HaoXing-BMS、HaoXing-server 两个归档仓库只记录状态；wx_key、echotrace、open-webui 三个 Fork 未修改。未新建账号级 `.github` 默认文件仓库。

## 已完成的验证

- 中央工具 9 项回归测试通过；官方 npm audit 为 0。各项目无需引入生成器依赖。
- 12 个目标仓库的生成一致性、内部链接、语言入口检查通过。12 张社交 PNG 均为 1280×640、低于 1 MB；浅深 Hero 均为 1200×360。SVG 文字转为轮廓，不依赖访客字体。
- macOS ARM 与 Linux x64 的真实 CI 暴露过波形小数差异，已固定坐标精度并加回归测试。各仓 CI 固定到渲染器提交 `268dd9dcc3702282dcce05647b929f2023f12f95`，不会随中央分支变化漂移。
- 主页手机端拥挤的三列表格已改成四段作品条目，原有入口保留。主页＋四试点在 GitHub 实际页面的 1280/390px × 浅色/深色共 20 组验证全部通过：图片加载、主题选图、全文无横向溢出、主要入口完整。截图和详细结果保存在本地忽略的 `output/playwright/proof-github-readmes/`、`proof-github-profile-recheck/`、`proof-github-pilots-recheck/` 中。
- 四个产品证据均来自实际代码或界面，用虚构/离线示例并记录来源。Flowloud 不伪造配音完成状态；BiliDigest 的输出图明确为离线 CLI 证据；可话花园不使用私人记录；命序采用内置虚构命盘。
- 命序原有及补充功能测试 96 项通过，类型检查和生产构建通过；迁移套件另有 27 项：10 项备份导入、8 项包/命令兼容、6 项 Worker 路由、3 项地址转换。跨来源浏览器演练验证备份、导入、重复/冲突/损坏数据与页面重载；WebMCP 原有浏览器测试通过。
- Cloudflare Worker 仅做 dry-run；保留上一版静态站点的流程与 `NEW_SITE_READY=false` 默认值已经准备。没有部署或启用 301。

产品仓库的依赖审计存在基线风险，不等于本轮品牌 CI 失败。命序有 8 项既有锁定依赖发现（4 high、3 moderate、1 low）；部分历史项目也有旧依赖风险，详见对应 PR。未借文档修改升级依赖或运行广泛自动修复；正式发布前应另行处理。BiliDigest 环境没有可用的 pip-audit，不能声称其 Python 依赖审计已通过。缺失或不明确的许可证已在[仓库审计](REPOSITORY-AUDIT.md)登记，没有自行选择许可。

## 尚未执行的发布动作

1. 审定主页与 Flowloud 样板，再逐仓审阅四个试点。按仓库分别合并，不自动批量合并；主页暂存。
2. 命序先合并并部署兼容准备，验收原站 `/backup/` 和 `/migration/`，将上一版静态构建与设置快照保存在执行副本之外。
3. 准备并核对 Cloudflare 权限、旧站恢复路由、新站 DNS/HTTPS 和 Pages 配置；将地址切换 PR 改为默认分支为基线，重新运行检查。仓库改名、执行副本 remote、Pages 与新站部署分别核验，不重新占用旧仓库名。
4. 新站 HTTPS、页面、Agent 文档和跨域数据迁移验收通过后，才启用旧站普通路径的保留路径/查询参数 301；旧域名 `/migration/` 继续可访问。失败时保持/恢复 false readiness 和旧静态站点。
5. 命序切换完成时，同步主页两处命序入口及中央 `projects/mingxu.json` 为新地址。旧恢复地址、引擎与存储标识、`mcp.jackmeds.top` 保持原值。
6. 四试点验收后发布主页，按[待应用设置](../release/metadata.json)更新 JM 头像、Bio、Description、已验证 Website、Topics、社交预览和四个 Pins。导出的图片不会自动成为 GitHub 社交预览。
7. 按顺序审阅并合并其余七个原创仓库轻量 PR，保留归档与 Fork 的原展示。

## 回退与执行副本

公开 README、默认分支 SHA、资料、Pins 和仓库元数据记录在 `baselines/2026-09-refresh/`。旧头像原始字节及 SHA256 保存在本地忽略的 `backups/original-avatar.bin` / `.json`，不依赖可变的头像 URL。

所有实现使用远程默认分支的新执行副本；原有脏工作区没有用于提交。仓库文档/素材可逐 PR revert；账号设置按基线恢复。命序的静态站点、DNS/Pages 与浏览器数据回退边界见其 `docs/mingxu-migration.md`，不会清除两个域名的 localStorage。

## 发布记录

14 个 PR 的链接、分支、基线和实现检查点集中在 [release/prs.json](../release/prs.json)。中央工具检查点为固定的渲染器实现提交，不包含其后的本交付索引更新。2026-09-05 核验时均为 OPEN Draft、未合并，记录检查点的 CI 全部成功。命序 #12 与 #13 均通过 `brand / check`、`validate`、`liuren-reference`、`webmcp-smoke`，后者包含跨来源备份/恢复演练。CI 状态以各 PR 当前结果为准，后续提交需要重新验证。
