import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
import { serveStatic } from "hono/bun";
import { MultipartProcessor } from "./multipart-processor.js";
import { createTraceRouter } from "./trace-router.js";
import { TraceDatabase } from "./database.js";
import { type SQLiteAdapter } from "./adapters/sqlite-adapter.js";
import { type PgAdapter } from "./adapters/pg-adapter.js";
const app = new Hono();

let adapter: SQLiteAdapter | PgAdapter;
if (process.env.TRACE_DATABASE_URL) {
    const { PgAdapter } = await import("./adapters/pg-adapter.js");
    adapter = new PgAdapter({
        connectionString: process.env.TRACE_DATABASE_URL,
    });
} else {
    const { SQLiteAdapter } = await import("./adapters/sqlite-adapter.js");
    adapter = new SQLiteAdapter("./.langgraph_api/trace.db");
}

// 创建全局的 multipart 处理器实例
const multipartProcessor = new MultipartProcessor(new TraceDatabase(adapter!));

// 创建 trace 路由器
const traceRouter = createTraceRouter(multipartProcessor["db"]);

app.use(logger());

// 静态文件服务 - 首页
app.use(
    "/ui/*",
    serveStatic({
        root: "./public/",
        rewriteRequestPath: (path) => path.replace(/^\/ui/, "/"),
    }),
);

// 挂载 trace 路由器
app.route("/trace", traceRouter);

app.get("/info", (c) => {
    return c.json({
        // API 版本
        version: "0.10.102",
        // 实例功能标志
        instance_flags: {
            // Blob 存储是否启用
            blob_storage_enabled: true,
            // Blob 存储引擎
            blob_storage_engine: "Bun SQLite",
            // 数据集示例分段是否启用
            dataset_examples_multipart_enabled: true,
            // 示例分段是否启用
            examples_multipart_enabled: true,
            // 实验性搜索是否启用
            experimental_search_enabled: false,
            // AI 查询生成是否启用
            generate_ai_query_enabled: true,
            // 组织创建是否禁用
            org_creation_disabled: false,
            // 支付是否启用
            payment_enabled: true,
            // 个人组织是否禁用
            personal_orgs_disabled: false,
            // Playground 认证绕过是否启用
            playground_auth_bypass_enabled: false,
            // 本地 SQLite 存储是否启用
            sqlite_storage_enabled: true,
            // 搜索是否启用
            search_enabled: true,
            // 显示 TTL UI
            show_ttl_ui: true,
            // 跟踪层持续时间（天）
            trace_tier_duration_days: {
                longlived: 400,
                shortlived: 14,
            },
            // 工作区范围组织邀请
            workspace_scope_org_invites: false,
            // 高性能 SQLite 压缩是否启用
            sqlite_wal_enabled: true,
        },
        // 批量摄取配置
        batch_ingest_config: {
            // 是否使用分段端点
            use_multipart_endpoint: true,
            // 扩容队列大小触发器
            scale_up_qsize_trigger: 1000,
            // 扩容线程限制
            scale_up_nthreads_limit: 16,
            // 缩容空闲触发器
            scale_down_nempty_trigger: 4,
            // 大小限制
            size_limit: 100,
            // 大小限制（字节）
            size_limit_bytes: 20971520,
        },
        // 数据库信息
        database_info: {
            type: "SQLite",
            engine: "Bun native SQLite",
            wal_mode: true,
            performance_optimized: true,
        },
        // 可用的 API 端点
        endpoints: {
            dashboard: "GET / - Web Dashboard",
            multipart: "POST /runs/multipart - Submit multipart data",
            trace_list:
                "GET /trace - Get all traces (supports ?system=xxx filter)",
            trace_systems: "GET /trace/systems - Get all available systems",
            trace_threads: "GET /trace/threads - Get all available thread IDs",
            thread_overviews:
                "GET /trace/threads/overview - Get thread overview information",
            trace_by_system:
                "GET /trace/system/{system} - Get traces by system",
            traces_by_thread:
                "GET /trace/thread/{threadId}/traces - Get traces by thread ID",
            thread_runs:
                "GET /trace/thread/{threadId}/runs - Get runs by thread ID",
            trace_info: "GET /trace/{traceId} - Get complete trace info",
            trace_summary: "GET /trace/{traceId}/summary - Get trace summary",
            trace_stats: "GET /trace/{traceId}/stats - Get trace statistics",
            run_detail: "GET /runs/{runId} - Get run details",
            run_feedback: "GET /runs/{runId}/feedback - Get run feedback",
            run_attachments:
                "GET /runs/{runId}/attachments - Get run attachments",
        },
    });
});

/** 接受 langSmith 参数的控件 */
app.post("/runs/multipart", async (c) => {
    try {
        const formData = await c.req.formData();
        const system = c.req.raw.headers.get("x-api-key") || undefined;
        const result = await multipartProcessor.processMultipartData(
            formData,
            system,
        );

        if (result.success) {
            return c.json({
                success: true,
                message: result.message,
                data: result.data,
            });
        } else {
            return c.json(
                {
                    success: false,
                    message: result.message,
                    errors: result.errors,
                },
                400,
            );
        }
    } catch (error) {
        console.error("Error processing multipart data:", error);
        return c.json(
            {
                success: false,
                message: "Internal server error",
                error: error instanceof Error ? error.message : String(error),
            },
            500,
        );
    }
});

app.notFound((c) => {
    return c.text("404 Not Found", 404);
});

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return err.getResponse();
    }
    console.error(`Error: ${err.message}`);
    return c.text("Internal Server Error", 500);
});

// 优雅关闭处理
process.on("SIGINT", () => {
    console.log("Shutting down gracefully...");
    multipartProcessor.close();
    process.exit(0);
});

process.on("SIGTERM", () => {
    console.log("Shutting down gracefully...");
    multipartProcessor.close();
    process.exit(0);
});

serve(
    {
        fetch: app.fetch,
        port: 7765,
    },
    (info) => {
        console.log(`🚀 Server is running on http://localhost:${info.port}`);
        console.log(`📊 Using Bun native SQLite for high performance`);
        console.log(
            `🎯 Web Dashboard: http://localhost:${info.port}/ui/index.html`,
        );
        console.log(
            `📋 Multipart API: POST http://localhost:${info.port}/runs/multipart`,
        );
        console.log(
            `🔍 Trace API: GET http://localhost:${info.port}/trace/{traceId}`,
        );
    },
);
