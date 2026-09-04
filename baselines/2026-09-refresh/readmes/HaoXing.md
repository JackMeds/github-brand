# HaoXing 平台

[English Version](README.en.md)

HaoXing 是一个面向中文内容创作者的 **Novel-to-Audio Drama Converter** 平台：将长篇小说拆分、解析后，自动生成角色对白脚本，再与多角色语音合成管线整合，最终导出可直接分发的有声剧。平台同时提供作品管理后台、前台试听站点以及完整的 Docker 化部署方案，帮助团队快速上线并迭代音频内容。

## 核心功能
- **小说到有声剧转换**：上传或粘贴小说文本后，服务会对章节进行结构化解析，识别角色、抽取对白，并调用多角色声音合成生成剧本与音频。
- **角色与声音管理**：为角色绑定预设音色，支持批量合成、试听与替换，方便在正式发布前进行审听与微调。
- **作品分发与展示**：前台站点提供有声剧目录、搜索与播放功能，后台可配置推荐位、章节信息与用户访问控制。
- **一键部署**：内置 Docker Compose 与打包脚本，一条命令即可在本地或服务器上部署全栈服务。

> 目前内置的文本解析与语音合成能力专注于 **中文** 内容，后续可扩展其他语言。

## 目录结构
- `HaoXing/`：主站点前端（Vite + Vue），面向终端用户的试听入口。
- `HaoXing-BMS/`：管理后台（Vue），用于作品、用户和声音资源的配置。
- `HaoXing-server/`：Node.js/Express 服务，负责文本解析、音频合成、数据接口。
- `Deployment/`：Docker Compose 配置与构建脚本，统一管理服务启动。
- `package.sh`：生成离线安装包的脚本，打包预构建镜像与安装指令。
- `old/`：仓库历史版本的归档快照。

## 部署前准备
- Docker（建议 24+ 版本）
- Docker Compose 插件

## 使用 Docker 快速部署
1. 确保 Docker 服务已启动。
2. 运行部署脚本：
   ```bash
   chmod +x Deployment/build.sh
   ./Deployment/build.sh
   ```
   脚本会构建所有容器镜像并启动服务：
   - 前台站点：http://localhost:8082
   - 管理后台：http://localhost:8081
   - API 服务：http://localhost:3000
   - MySQL 数据库：端口 3306（账号信息见 `Deployment/docker-compose.yml`）

停止服务可执行：
```bash
docker-compose -f Deployment/docker-compose.yml down
```

## 生成离线安装包
在仓库根目录执行：
```bash
chmod +x package.sh
./package.sh
```
脚本会打包预构建的 Docker 镜像并生成 `haoxing_release.tar.gz`，用于在无网络环境的服务器上快速安装。

## 开发与自定义建议
- 根据生产环境需要，调整 `Deployment/docker-compose.yml` 中的环境变量与持久化配置。
- 语音合成所需的密钥应通过环境变量注入，不要写入源码。
- 首次本地开发时需要进入 `HaoXing/`、`HaoXing-BMS/`、`HaoXing-server/` 分别安装依赖（例如 `npm install`）。
- 如需扩展多语言支持，可在服务器模块中扩展解析逻辑与语音模型配置。

如需了解英文说明，请查看 [README.en.md](README.en.md)。
