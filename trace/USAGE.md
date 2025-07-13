# 🚀 Multipart Trace API 使用指南

基于 Bun 的高性能 SQLite 数据库的 multipart 数据处理 API，现在包含 Web 管理界面！

## 🎯 功能特性

-   ✅ **高性能存储**：使用 Bun 原生 SQLite（比 better-sqlite3 快 3-6 倍）
-   ✅ **WAL 模式**：支持并发读写，提升性能
-   ✅ **Multipart 处理**：完整实现 multipart/form-data 解析
-   ✅ **数据类型支持**：runs 创建/更新、feedback、attachments
-   ✅ **Out-of-band 存储**：大数据字段独立存储
-   ✅ **事务支持**：确保数据一致性
-   ✅ **RESTful API**：提供查询接口
-   ✅ **Web Dashboard**：现代化的 Web 管理界面
-   ✅ **Trace Router**：专门的 trace 查询路由器

## 🛠️ 快速开始

### 1. 安装依赖

```bash
bun install
```

### 2. 启动服务器

```bash
bun dev
```

### 3. 访问 Web Dashboard

打开浏览器访问：http://localhost:7765/

### 4. 或运行测试脚本

```bash
# 在新终端中运行
bun test-multipart-bun.ts
```

## 🌐 Web Dashboard

访问 `http://localhost:7765/` 即可使用现代化的 Web 管理界面：

### 功能特性：

-   🔍 **可视化查询**：通过 Web 界面查询 trace 数据
-   📊 **实时统计**：显示 runs、feedback、attachments 统计
-   🧪 **测试数据创建**：一键创建测试数据进行体验
-   📱 **响应式设计**：支持桌面和移动设备
-   💫 **现代 UI**：美观的渐变背景和卡片设计

### 操作指南：

1. 输入 Trace ID（或点击"创建测试数据"）
2. 选择查询类型（完整信息/概要/统计）
3. 查看结果和 JSON 数据

## 📋 API 接口

### Web Dashboard

```
GET / - Web 管理界面
```

### Trace 专用路由器

```
GET /trace/{traceId} - 获取完整的 trace 信息
GET /trace/{traceId}/summary - 获取 trace 概要
GET /trace/{traceId}/stats - 获取 trace 统计信息
```

### Multipart 数据提交

```
POST /runs/multipart
Content-Type: multipart/form-data
```

支持的 part 名称模式：

-   `post.{run_id}` - 创建 run
-   `patch.{run_id}` - 更新 run
-   `post.{run_id}.{field}` - Out-of-band 数据
-   `feedback.{run_id}` - 反馈数据
-   `attachment.{run_id}.{filename}` - 附件

### 单独查询接口（向后兼容）

-   `GET /runs/{runId}` - 获取 run 详情
-   `GET /runs/{runId}/feedback` - 获取 run 的反馈
-   `GET /runs/{runId}/attachments` - 获取 run 的附件
-   `GET /info` - 获取服务器信息

## 📊 数据库表结构

### runs 表

-   `id` (主键)
-   `trace_id`
-   `name`
-   `run_type`
-   `start_time` / `end_time`
-   `inputs` / `outputs` / `events` (JSON)
-   `error` / `extra` / `serialized` (JSON)
-   `created_at` / `updated_at`

### feedback 表

-   `id` (主键)
-   `trace_id` (必需)
-   `run_id` (外键)
-   `score` / `comment` / `metadata`
-   `created_at`

### attachments 表

-   `id` (主键)
-   `run_id` (外键)
-   `filename` / `content_type` / `file_size`
-   `storage_path`
-   `created_at`

## 🔧 配置文件

-   `multipart-config.json` - API 配置
-   `multipart-spec.json` - 完整规格说明
-   `multipart-types.ts` - TypeScript 类型定义
-   `trace-router.ts` - Trace 专用路由器
-   `public/index.html` - Web Dashboard 界面

## 📁 文件存储

-   数据库文件：`trace.db`
-   附件目录：`./attachments/`
-   文件命名：`{run_id}_{filename}`
-   静态文件：`./public/`

## 💡 性能优化

-   使用 WAL 模式提升并发性能
-   预编译 SQL 语句
-   事务批处理
-   索引优化查询
-   静态文件缓存

## 🎉 测试示例

### Web Dashboard 测试：

1. 访问 http://localhost:7765/
2. 点击"创建测试数据"
3. 使用生成的 Trace ID 进行查询
4. 查看不同类型的数据展示

### 脚本测试：

```bash
bun test-multipart-bun.ts
```

测试脚本会自动：

1. 创建 run 数据
2. 添加大量 out-of-band 数据
3. 提交 feedback
4. 上传附件
5. 查询所有数据验证完整性

## 🔗 API 端点总览

| 方法 | 路径                        | 描述                |
| ---- | --------------------------- | ------------------- |
| GET  | `/`                         | Web Dashboard       |
| POST | `/runs/multipart`           | 提交 multipart 数据 |
| GET  | `/trace/{traceId}`          | 完整 trace 信息     |
| GET  | `/trace/{traceId}/summary`  | Trace 概要          |
| GET  | `/trace/{traceId}/stats`    | Trace 统计          |
| GET  | `/runs/{runId}`             | Run 详情            |
| GET  | `/runs/{runId}/feedback`    | Run 反馈            |
| GET  | `/runs/{runId}/attachments` | Run 附件            |
| GET  | `/info`                     | 服务器信息          |

🚀 **立即体验**：启动服务器后访问 http://localhost:7765/ 开始使用！
