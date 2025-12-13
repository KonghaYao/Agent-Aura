# Agent-Stack Turbo

本文档概述了 Agent-Stack 的高层次架构，按照逻辑分层展示系统的主要组件及其交互方式。系统采用模块化的分层设计，确保各层职责清晰，易于扩展与维护。

## 1. 架构概览 (Architecture Overview)

系统自上而下分为以下五个逻辑层级：

1.  **交互层 (Interaction Layer)**: 用户界面与客户端 SDK，负责呈现与交互。
2.  **服务层 (Service Layer)**: API 网关与应用服务，负责请求路由、鉴权与连接管理。
3.  **Agent 层 (Agent Layer)**: Agent 核心运行时，负责编排复杂的 AI 业务逻辑。
4.  **模型层 (Model Layer)**: 统一的模型接入网关，屏蔽底层 LLM 差异。
5.  **数据层 (Data Layer)**: 持久化存储，包含业务数据、向量数据与文件存储。

此外，**基础设施与运维 (Infrastructure & Ops)** 贯穿全流程，提供部署与监控支持。

---

## 2. 交互层 (Interaction Layer)

负责处理用户输入、展示 Agent 状态及可视化结果。

-   **Web 框架**: [Astro](https://astro.build/) + [React](https://react.dev/)
-   **UI 组件库**: ShadCN + AI Elements
-   **客户端 SDK**: `@langgraph-js/sdk`
-   **通信协议**: Agent Protocol (基于 SSE / WebSocket)

## 3. 服务层 (Service Layer)

作为系统的后端入口，处理 HTTP 请求、身份验证及与客户端的实时通信。

-   **核心框架**: [Hono](https://hono.dev/)
-   **运行时环境**: 支持 Bun / Node.js / Deno
-   **身份验证 (Authentication)**:
    -   **方案**: [Better Auth](https://better-auth.com/)
    -   **集成**: 深度集成于 Hono，管理用户会话与权限。
-   **开发工具**: `@langgraph-js/ui` (用于本地调试 Agent 图)

## 4. Agent 层 (Agent Layer)

业务逻辑的核心，由 **LangGraph JS** 驱动，实现有状态的多轮对话与任务编排。

-   **Agent 框架**: `Open LangGraph Server` + `LangGraphJS`
-   **核心能力**:
    -   **图编排 (Graph Orchestration)**: 定义复杂的 Agent 节点与边。
    -   **状态管理 (State Management)**: 自动持久化与恢复对话状态。
    -   **人机协同 (Human-in-the-loop)**: 支持人工介入与断点续行。

## 5. 模型层 (Model Layer)

聚合各类外部 LLM 厂商接口，对内提供标准化的调用方式。

-   **统一协议**: OpenAI API Standard (兼容)
-   **接入模型**:
    -   **Google** (Gemini)
    -   **xAI** (Grok)
    -   **DeepSeek**
    -   **OpenAI** (GPT-4o 等)

## 6. 数据层 (Data Layer)

负责系统数据的持久化、检索与文件管理。

-   **查询构建器**: Kysely
-   **关系型数据库**: PostgreSQL / SQLite (存储业务数据、Auth 数据、Agent Checkpoints)
-   **缓存中间件**: Redis
-   **向量数据库**: Postgres (pgvector) (用于 RAG 知识库与长期记忆)
-   **文件存储**: S3 兼容对象存储

## 7. 基础设施与运维 (Infrastructure & Ops)

保障系统的稳定运行、快速交付与可观测性。

-   **可观察性 (Observability)**:
    -   **链路追踪**: OpenSmith / LangFuse
    -   **日志系统**: Hono Logger, Cloud Logging
-   **部署 (Deployment)**:
    -   **前端托管**: 静态服务 (Netlify, Vercel, Nginx)
    -   **后端服务**: 容器化 (Docker, Cloud Run)
    -   **构建工具**: Vite, Bun
