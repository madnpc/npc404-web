# npc404-web

《末日NPC都不太正常》的玩家端 Web 应用仓库。

本仓库负责玩家直接使用的浏览器体验：剧情阅读、玩家输入、房间状态、本地剧情存档、断线恢复和后续管理端界面。

## 项目边界

`npc404-web` 只负责客户端体验，不承担权威世界结算。

客户端可以：

- 展示剧情文本和回合结果。
- 提交玩家 Command。
- 缓存待同步 Command。
- 使用 IndexedDB 保存完整本地叙事。
- 通过 HTTP 和 WebSocket 同步服务端状态。
- 在断线后按事件 sequence 恢复。

客户端不可以：

- 直接修改资源、角色状态或剧情 Flags。
- 自行决定角色死亡、秘密暴露或结局。
- 绕过服务端进入下一回合。
- 把本地叙事文本当作权威事实。

## 计划技术栈

```text
React
Vite
TypeScript
TanStack Router
TanStack Query
Zustand
Dexie
Socket.IO Client
```

第一版不使用 Next.js 作为主游戏框架。主游戏页面以客户端交互、IndexedDB、本地叙事和 WebSocket 为核心，不需要 SSR。

## 主要页面

第一阶段建议从这些页面开始：

- 游戏主界面：剧情流、状态栏、行动输入。
- 本地存档列表：继续游戏、查看本地剧情。
- 单人开局页：选择剧本并创建世界。
- 房间页：后续双人合作模式使用。

## 与其他仓库的关系

- `npc404`: 游戏服务端、规则核心、Agent Worker、数据库和共享协议。
- `npc404-docs`: 技术方案、玩法规格、剧情设定和内容规范。

运行时主链路：

```text
npc404-web
→ HTTP/WebSocket
→ npc404 Game Server
→ Rule Engine / Agent Worker
→ Canonical Events
→ npc404-web IndexedDB Narrative
```

## 当前状态

仓库当前包含一个可运行的 feasibility demo：

- Vite + React + TypeScript。
- Tailwind + shadcn-style 本地组件。
- 废弃社区诊所主界面。
- 玩家行动选项。
- 事件流和 NPC 状态展示。
- 重大事件 screen shake。
- 选项和叙事切换过渡。

## 本地运行

先启动 `npc404` 服务端，再启动本仓库：

```bash
pnpm install
pnpm dev
```

默认地址：

```text
http://127.0.0.1:5173
```

如果服务端地址不是默认值，创建本地 `.env`：

```text
VITE_API_BASE_URL=http://127.0.0.1:8787
```

构建检查：

```bash
pnpm build
```
