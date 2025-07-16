import { serve } from "@hono/node-server";
import { serveStatic } from "hono/serve-static";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";
// import { serveStatic } from "hono/bun";
import { MultipartProcessor } from "./multipart-processor.js";
import { createTraceRouter } from "./trace-router.js";
import { TraceDatabase, type DatabaseAdapter } from "./database.js";
import path from "path";
import fs from "fs";

// 实现 __dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const app = new Hono();

let adapter: DatabaseAdapter;

if (process.env.TRACE_DATABASE_URL) {
    const { PgAdapter } = await import("./adapters/pg-adapter.js");
    adapter = new PgAdapter({
        connectionString: process.env.TRACE_DATABASE_URL,
    });
} else if (
    /** @ts-ignore */
    typeof globalThis.Bun !== "undefined"
) {
    const { BunSQLiteAdapter } = await import(
        "./adapters/bun-sqlite-adapter.js"
    );
    adapter = new BunSQLiteAdapter();
} else {
    const { BetterSqliteAdapter } = await import(
        "./adapters/better-sqlite-adapter.js"
    );
    adapter = new BetterSqliteAdapter();
}

const db = new TraceDatabase(adapter!);
await db.init();
// 创建全局的 multipart 处理器实例
const multipartProcessor = new MultipartProcessor(db);

// 创建 trace 路由器
const traceRouter = createTraceRouter(multipartProcessor["db"]);

app.use(logger());

// /v1/metadata/submit
app.post("/v1/metadata/submit", async (c) => {
    const body = await c.req.json();
    // console.log(body);
    return c.text("");
});

const uiPath = path.join(__dirname, "../public/");
app.use(
    "/ui/*",
    serveStatic({
        root: "./",
        getContent: async (path) => {
            return fs.readFileSync(uiPath + path.replace("ui/", ""), "utf-8");
        },
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
            batch: "POST /runs/batch - Submit batch data",
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

app.post("/runs/batch", async (c) => {
    const body = await c.req.json();
    const fd = new FormData();
    body.patch?.forEach((item: any) => {
        fd.append("patch.222333", JSON.stringify(item));
    });
    body.post?.forEach((item: any) => {
        fd.append("post.222333", JSON.stringify(item));
    });
    const system = c.req.raw.headers.get("x-api-key") || undefined;
    const result = await multipartProcessor.processMultipartData(fd, system);
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

app.notFound(async (c) => {
    const url = c.req.url;
    const method = c.req.method;
    const headers = c.req.raw.headers;
    let curlCommand = `curl -X ${method} ${url}`;

    // 添加请求头
    for (const [key, value] of headers.entries()) {
        // 排除一些默认的、不需要打印的头
        if (
            ![
                "host",
                "connection",
                "content-length",
                "user-agent",
                "accept-encoding",
            ].includes(key.toLowerCase())
        ) {
            curlCommand += ` -H '${key}: ${value}'`;
        }
    }

    // 处理请求体（仅限 POST, PUT, PATCH）
    if (method === "POST" || method === "PUT" || method === "PATCH") {
        try {
            const contentType = headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const jsonBody = await c.req.json();
                curlCommand += ` -H 'Content-Type: application/json' -d '${JSON.stringify(
                    jsonBody,
                ).replace(/'/g, "'''")}'`;
            } else if (contentType?.includes("multipart/form-data")) {
                // 对于 multipart/form-data，需要特殊处理，因为FormData()会消耗流
                // 这里只能打印一个提示，无法完全重构出 curl -F 命令
                curlCommand += ` -H 'Content-Type: ${contentType}' -F '... (multipart form data, refer to original request)'`;
            } else if (c.req.raw.body) {
                // 尝试读取原始 body，但Hono可能已经消耗了
                // 这里只是一个尝试，不保证成功
                const bodyText = await c.req.text();
                if (bodyText) {
                    curlCommand += ` -d '${bodyText.replace(/'/g, "'''")}'`;
                }
            }
        } catch (e) {
            console.warn("Could not parse request body for curl command:", e);
        }
    }

    console.log(
        "\n--- Incoming Request as Curl Command ---\n" +
            curlCommand +
            "\n--------------------------------------\n",
    );

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
