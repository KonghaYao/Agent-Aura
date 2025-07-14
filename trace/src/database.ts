import { v4 as uuidv4 } from "uuid";
import type { RunPayload, FeedbackPayload } from "./multipart-types.js";
import { SQLiteAdapter } from "./adapters/sqlite-adapter.js";

export interface RunRecord {
    id: string;
    trace_id?: string;
    name?: string;
    run_type?: string;
    system?: string; // 系统标识，来自 x-api-key
    thread_id?: string; // 线程ID，来自 extra.metadata.thread_id
    start_time?: string;
    end_time?: string;
    inputs?: string; // JSON string
    outputs?: string; // JSON string
    events?: string; // JSON string
    error?: string; // JSON string
    extra?: string; // JSON string
    serialized?: string; // JSON string
    total_tokens?: number; // 新增字段：总 token 数
    created_at: string;
    updated_at: string;
}

export interface FeedbackRecord {
    id: string;
    trace_id: string;
    run_id: string;
    feedback_id?: string;
    score?: number;
    comment?: string;
    metadata?: string; // JSON string
    created_at: string;
}

export interface AttachmentRecord {
    id: string;
    run_id: string;
    filename: string;
    content_type: string;
    file_size: number;
    storage_path: string;
    created_at: string;
}

export interface TraceOverview {
    trace_id: string;
    total_runs: number;
    total_feedback: number;
    total_attachments: number;
    first_run_time: string;
    last_run_time: string;
    run_types: string[];
    systems: string[]; // 涉及的系统列表
    total_tokens_sum?: number; // 新增：总 token 消耗量
}

// 数据库适配器接口
export interface DatabaseAdapter {
    exec(sql: string): void;
    prepare(sql: string): PreparedStatement;
    transaction<T extends any[], R>(fn: (...args: T) => R): (...args: T) => R;
    close(): void;
    getStringAggregateFunction(
        column: string,
        distinct: boolean,
        delimiter: string,
    ): string;
}

// 预处理语句接口
export interface PreparedStatement {
    run(params?: any[]): { changes: number };
    get(params?: any): any;
    all(params?: any): any[];
}

export class TraceDatabase {
    private adapter: DatabaseAdapter;

    constructor(adapter: DatabaseAdapter) {
        this.adapter = adapter;
        this.initTables();
    }

    // 从 outputs 字段中提取 total_tokens 的辅助方法
    private extractTotalTokensFromOutputs(outputs?: string | object): number {
        if (!outputs) return 0;
        try {
            const outputData =
                typeof outputs === "string" ? JSON.parse(outputs) : outputs;
            if (
                outputData &&
                outputData.llmOutput &&
                outputData.llmOutput.tokenUsage
            ) {
                return outputData.llmOutput.tokenUsage.totalTokens || 0;
            }
        } catch (error) {
            console.warn("解析 outputs 提取 total_tokens 时出错:", error);
        }
        return 0;
    }

    private initTables(): void {
        // 开启 WAL 模式以提高性能
        this.adapter.exec("PRAGMA journal_mode = WAL;");

        // 创建 runs 表
        this.adapter.exec(`
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                trace_id TEXT,
                name TEXT,
                run_type TEXT,
                system TEXT,
                thread_id TEXT,
                start_time TEXT,
                end_time TEXT,
                inputs TEXT,
                outputs TEXT,
                events TEXT,
                error TEXT,
                extra TEXT,
                serialized TEXT,
                total_tokens INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        // 创建 feedback 表
        this.adapter.exec(`
            CREATE TABLE IF NOT EXISTS feedback (
                id TEXT PRIMARY KEY,
                trace_id TEXT NOT NULL,
                run_id TEXT NOT NULL,
                feedback_id TEXT,
                score REAL,
                comment TEXT,
                metadata TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES runs (id)
            )
        `);

        // 创建 attachments 表
        this.adapter.exec(`
            CREATE TABLE IF NOT EXISTS attachments (
                id TEXT PRIMARY KEY,
                run_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                content_type TEXT,
                file_size INTEGER,
                storage_path TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (run_id) REFERENCES runs (id)
            )
        `);

        // 创建索引
        this.adapter.exec(`
            CREATE INDEX IF NOT EXISTS idx_runs_trace_id ON runs (trace_id);
            CREATE INDEX IF NOT EXISTS idx_runs_thread_id ON runs (thread_id);
            CREATE INDEX IF NOT EXISTS idx_feedback_trace_id ON feedback (trace_id);
            CREATE INDEX IF NOT EXISTS idx_feedback_run_id ON feedback (run_id);
            CREATE INDEX IF NOT EXISTS idx_attachments_run_id ON attachments (run_id);
        `);
    }

    // 从 extra 字段中提取 thread_id 的辅助方法
    private extractThreadIdFromExtra(extra: any): string | undefined {
        if (!extra) return undefined;

        try {
            const extraData =
                typeof extra === "string" ? JSON.parse(extra) : extra;
            return extraData?.metadata?.thread_id;
        } catch (error) {
            return undefined;
        }
    }

    // 获取所有 traceId 及其概要信息
    getAllTraces(): TraceOverview[] {
        const stmt = this.adapter.prepare(`
            SELECT 
                trace_id,
                COUNT(*) as total_runs,
                MIN(created_at) as first_run_time,
                MAX(created_at) as last_run_time,
                ${this.adapter.getStringAggregateFunction(
                    "run_type",
                    true,
                    ",",
                )} as run_types,
                ${this.adapter.getStringAggregateFunction(
                    "system",
                    true,
                    ",",
                )} as systems,
                SUM(total_tokens) as total_tokens_sum
            FROM runs 
            WHERE trace_id IS NOT NULL 
            GROUP BY trace_id 
            ORDER BY MAX(created_at) DESC
        `);

        const traces = stmt.all() as any[];

        return traces.map((trace) => {
            // 获取该 trace 的 feedback 和 attachments 统计
            const feedbackStmt = this.adapter.prepare(`
                SELECT COUNT(*) as count FROM feedback WHERE trace_id = ?
            `);
            const attachmentStmt = this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM attachments a
                JOIN runs r ON a.run_id = r.id 
                WHERE r.trace_id = ?
            `);

            const feedbackCount = feedbackStmt.get(trace.trace_id) as any;
            const attachmentCount = attachmentStmt.get(trace.trace_id) as any;

            return {
                trace_id: trace.trace_id,
                total_runs: trace.total_runs,
                total_feedback: feedbackCount.count,
                total_attachments: attachmentCount.count,
                first_run_time: trace.first_run_time,
                last_run_time: trace.last_run_time,
                run_types: trace.run_types
                    ? trace.run_types.split(",").filter(Boolean)
                    : [],
                systems: trace.systems
                    ? trace.systems.split(",").filter(Boolean)
                    : [],
                total_tokens_sum: trace.total_tokens_sum || 0,
            };
        });
    }

    // Run 操作
    createRun(runData: RunPayload): RunRecord {
        const id = runData.id || uuidv4();
        const now = new Date().toISOString();

        // 从 extra 中提取 thread_id（如果未直接提供）
        const threadId =
            runData.thread_id || this.extractThreadIdFromExtra(runData.extra);

        const record: RunRecord = {
            id,
            trace_id: runData.trace_id,
            name: runData.name,
            run_type: runData.run_type,
            system: runData.system,
            thread_id: threadId,
            start_time: runData.start_time,
            end_time: runData.end_time,
            inputs: runData.inputs ? JSON.stringify(runData.inputs) : undefined,
            outputs: runData.outputs
                ? JSON.stringify(runData.outputs)
                : undefined,
            events: runData.events ? JSON.stringify(runData.events) : undefined,
            error: runData.error ? JSON.stringify(runData.error) : undefined,
            extra: runData.extra ? JSON.stringify(runData.extra) : undefined,
            serialized: runData.serialized
                ? JSON.stringify(runData.serialized)
                : undefined,
            created_at: now,
            updated_at: now,
            total_tokens: runData.outputs
                ? this.extractTotalTokensFromOutputs(runData.outputs)
                : 0,
        };

        const stmt = this.adapter.prepare(`
            INSERT INTO runs (
                id, trace_id, name, run_type, system, thread_id, start_time, end_time,
                inputs, outputs, events, error, extra, serialized, total_tokens,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            record.id,
            record.trace_id,
            record.name,
            record.run_type,
            record.system,
            record.thread_id,
            record.start_time,
            record.end_time,
            record.inputs,
            record.outputs,
            record.events,
            record.error,
            record.extra,
            record.serialized,
            record.total_tokens,
            record.created_at,
            record.updated_at,
        ]);

        return record;
    }

    updateRun(runId: string, runData: RunPayload): RunRecord | null {
        const now = new Date().toISOString();

        const updateFields: string[] = [];
        const updateValues: any[] = [];

        if (runData.trace_id !== undefined) {
            updateFields.push("trace_id = ?");
            updateValues.push(runData.trace_id);
        }
        if (runData.name !== undefined) {
            updateFields.push("name = ?");
            updateValues.push(runData.name);
        }
        if (runData.run_type !== undefined) {
            updateFields.push("run_type = ?");
            updateValues.push(runData.run_type);
        }
        if (runData.system !== undefined) {
            updateFields.push("system = ?");
            updateValues.push(runData.system);
        }
        if (runData.start_time !== undefined) {
            updateFields.push("start_time = ?");
            updateValues.push(runData.start_time);
        }
        if (runData.end_time !== undefined) {
            updateFields.push("end_time = ?");
            updateValues.push(runData.end_time);
        }
        if (runData.inputs !== undefined) {
            updateFields.push("inputs = ?");
            updateValues.push(JSON.stringify(runData.inputs));
        }
        if (runData.outputs !== undefined) {
            updateFields.push("outputs = ?");
            updateValues.push(JSON.stringify(runData.outputs));
            // 如果 outputs 被更新，重新计算并更新 total_tokens
            updateFields.push("total_tokens = ?");
            updateValues.push(
                this.extractTotalTokensFromOutputs(runData.outputs),
            );
        } else if (runData.total_tokens !== undefined) {
            updateFields.push("total_tokens = ?");
            updateValues.push(runData.total_tokens);
        }
        if (runData.events !== undefined) {
            updateFields.push("events = ?");
            updateValues.push(JSON.stringify(runData.events));
        }
        if (runData.error !== undefined) {
            updateFields.push("error = ?");
            updateValues.push(JSON.stringify(runData.error));
        }
        if (runData.extra !== undefined) {
            updateFields.push("extra = ?");
            updateValues.push(JSON.stringify(runData.extra));

            // 如果更新了 extra 且没有直接提供 thread_id，尝试从 extra 中提取
            if (runData.thread_id === undefined) {
                const threadId = this.extractThreadIdFromExtra(runData.extra);
                if (threadId) {
                    updateFields.push("thread_id = ?");
                    updateValues.push(threadId);
                }
            }
        }
        if (runData.thread_id !== undefined) {
            updateFields.push("thread_id = ?");
            updateValues.push(runData.thread_id);
        }
        if (runData.serialized !== undefined) {
            updateFields.push("serialized = ?");
            updateValues.push(JSON.stringify(runData.serialized));
        }
        if (runData.total_tokens !== undefined) {
            updateFields.push("total_tokens = ?");
            updateValues.push(runData.total_tokens);
        }

        if (updateFields.length === 0) {
            return this.getRun(runId);
        }

        updateFields.push("updated_at = ?");
        updateValues.push(now);
        updateValues.push(runId);

        const stmt = this.adapter.prepare(`
            UPDATE runs SET ${updateFields.join(", ")} WHERE id = ?
        `);

        const result = stmt.run(updateValues);

        if (result.changes === 0) {
            return null;
        }

        return this.getRun(runId);
    }

    updateRunField(runId: string, field: string, value: any): RunRecord | null {
        const now = new Date().toISOString();
        const jsonValue = JSON.stringify(value);

        const stmt = this.adapter.prepare(`
            UPDATE runs SET ${field} = ?, updated_at = ? WHERE id = ?
        `);

        const result = stmt.run([jsonValue, now, runId]);

        if (field === "outputs") {
            const total_tokens = this.extractTotalTokensFromOutputs(value);
            this.updateRunField(runId, "total_tokens", total_tokens);
        }

        if (result.changes === 0) {
            return null;
        }

        return this.getRun(runId);
    }

    getRun(runId: string): RunRecord | null {
        const stmt = this.adapter.prepare("SELECT * FROM runs WHERE id = ?");
        const result = stmt.get(runId);
        return (result as RunRecord) || null;
    }

    // Feedback 操作
    createFeedback(
        runId: string,
        feedbackData: FeedbackPayload,
    ): FeedbackRecord {
        const id = uuidv4();
        const now = new Date().toISOString();

        const record: FeedbackRecord = {
            id,
            trace_id: feedbackData.trace_id,
            run_id: runId,
            feedback_id: feedbackData.feedback_id,
            score: feedbackData.score,
            comment: feedbackData.comment,
            metadata: feedbackData.metadata
                ? JSON.stringify(feedbackData.metadata)
                : undefined,
            created_at: now,
        };

        const stmt = this.adapter.prepare(`
            INSERT INTO feedback (
                id, trace_id, run_id, feedback_id, score, comment, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            record.id,
            record.trace_id,
            record.run_id,
            record.feedback_id,
            record.score,
            record.comment,
            record.metadata,
            record.created_at,
        ]);

        return record;
    }

    // Attachment 操作
    createAttachment(
        runId: string,
        filename: string,
        contentType: string,
        fileSize: number,
        storagePath: string,
    ): AttachmentRecord {
        const id = uuidv4();
        const now = new Date().toISOString();

        const record: AttachmentRecord = {
            id,
            run_id: runId,
            filename,
            content_type: contentType,
            file_size: fileSize,
            storage_path: storagePath,
            created_at: now,
        };

        const stmt = this.adapter.prepare(`
            INSERT INTO attachments (
                id, run_id, filename, content_type, file_size, storage_path, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            record.id,
            record.run_id,
            record.filename,
            record.content_type,
            record.file_size,
            record.storage_path,
            record.created_at,
        ]);

        return record;
    }

    // 查询操作
    getRunsByTraceId(traceId: string): RunRecord[] {
        const stmt = this.adapter.prepare(
            "SELECT * FROM runs WHERE trace_id = ? ORDER BY created_at",
        );
        return stmt.all(traceId) as RunRecord[];
    }

    // 根据系统过滤获取 traces
    getTracesBySystem(system: string): TraceOverview[] {
        const stmt = this.adapter.prepare(`
            SELECT 
                trace_id,
                COUNT(*) as total_runs,
                MIN(created_at) as first_run_time,
                MAX(created_at) as last_run_time,
                ${this.adapter.getStringAggregateFunction(
                    "run_type",
                    true,
                    ",",
                )} as run_types,
                ${this.adapter.getStringAggregateFunction(
                    "system",
                    true,
                    ",",
                )} as systems,
                SUM(total_tokens) as total_tokens_sum
            FROM runs 
            WHERE trace_id IS NOT NULL AND system = ?
            GROUP BY trace_id 
            ORDER BY MAX(created_at) DESC
        `);

        const traces = stmt.all(system) as any[];

        return traces.map((trace) => {
            // 获取该 trace 的 feedback 和 attachments 统计
            const feedbackStmt = this.adapter.prepare(`
                SELECT COUNT(*) as count FROM feedback WHERE trace_id = ?
            `);
            const attachmentStmt = this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM attachments a
                JOIN runs r ON a.run_id = r.id 
                WHERE r.trace_id = ?
            `);

            const feedbackCount = feedbackStmt.get(trace.trace_id) as any;
            const attachmentCount = attachmentStmt.get(trace.trace_id) as any;

            return {
                trace_id: trace.trace_id,
                total_runs: trace.total_runs,
                total_feedback: feedbackCount.count,
                total_attachments: attachmentCount.count,
                first_run_time: trace.first_run_time,
                last_run_time: trace.last_run_time,
                run_types: trace.run_types
                    ? trace.run_types.split(",").filter(Boolean)
                    : [],
                systems: trace.systems
                    ? trace.systems.split(",").filter(Boolean)
                    : [],
                total_tokens_sum: trace.total_tokens_sum || 0,
            };
        });
    }

    // 根据系统获取 runs
    getRunsBySystem(system: string): RunRecord[] {
        const stmt = this.adapter.prepare(
            "SELECT * FROM runs WHERE system = ? ORDER BY created_at DESC",
        );
        return stmt.all(system) as RunRecord[];
    }

    // 根据线程ID获取 runs
    getRunsByThreadId(threadId: string): RunRecord[] {
        const stmt = this.adapter.prepare(
            "SELECT * FROM runs WHERE thread_id = ? ORDER BY created_at DESC",
        );
        return stmt.all(threadId) as RunRecord[];
    }

    // 根据线程ID获取相关的 traces
    getTracesByThreadId(threadId: string): TraceOverview[] {
        const stmt = this.adapter.prepare(`
            SELECT 
                trace_id,
                COUNT(*) as total_runs,
                MIN(created_at) as first_run_time,
                MAX(created_at) as last_run_time,
                ${this.adapter.getStringAggregateFunction(
                    "run_type",
                    true,
                    ",",
                )} as run_types,
                ${this.adapter.getStringAggregateFunction(
                    "system",
                    true,
                    ",",
                )} as systems,
                SUM(total_tokens) as total_tokens_sum
            FROM runs 
            WHERE trace_id IS NOT NULL AND thread_id = ?
            GROUP BY trace_id 
            ORDER BY MAX(created_at) DESC
        `);

        const traces = stmt.all(threadId) as any[];

        return traces.map((trace) => {
            // 获取该 trace 的 feedback 和 attachments 统计
            const feedbackStmt = this.adapter.prepare(`
                SELECT COUNT(*) as count FROM feedback WHERE trace_id = ?
            `);
            const attachmentStmt = this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM attachments a
                JOIN runs r ON a.run_id = r.id 
                WHERE r.trace_id = ?
            `);

            const feedbackCount = feedbackStmt.get(trace.trace_id) as any;
            const attachmentCount = attachmentStmt.get(trace.trace_id) as any;

            return {
                trace_id: trace.trace_id,
                total_runs: trace.total_runs,
                total_feedback: feedbackCount.count,
                total_attachments: attachmentCount.count,
                first_run_time: trace.first_run_time,
                last_run_time: trace.last_run_time,
                run_types: trace.run_types
                    ? trace.run_types.split(",").filter(Boolean)
                    : [],
                systems: trace.systems
                    ? trace.systems.split(",").filter(Boolean)
                    : [],
                total_tokens_sum: trace.total_tokens_sum || 0,
            };
        });
    }

    // 获取线程ID概览信息
    getThreadOverviews(): Array<{
        thread_id: string;
        total_runs: number;
        total_traces: number;
        total_feedback: number;
        total_attachments: number;
        first_run_time: string;
        last_run_time: string;
        run_types: string[];
        systems: string[];
        total_tokens_sum: number; // 新增：总 token 消耗量
    }> {
        const stmt = this.adapter.prepare(`
            SELECT 
                thread_id,
                COUNT(*) as total_runs,
                COUNT(DISTINCT trace_id) as total_traces,
                MIN(created_at) as first_run_time,
                MAX(created_at) as last_run_time,
                ${this.adapter.getStringAggregateFunction(
                    "run_type",
                    true,
                    ",",
                )} as run_types,
                ${this.adapter.getStringAggregateFunction(
                    "system",
                    true,
                    ",",
                )} as systems,
                SUM(total_tokens) as total_tokens_sum
            FROM runs 
            WHERE thread_id IS NOT NULL AND thread_id != ''
            GROUP BY thread_id 
            ORDER BY MAX(created_at) DESC
        `);

        const threads = stmt.all() as any[];

        return threads.map((thread) => {
            // 获取该 thread 的 feedback 和 attachments 统计
            const feedbackStmt = this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM feedback f
                JOIN runs r ON f.run_id = r.id 
                WHERE r.thread_id = ?
            `);
            const attachmentStmt = this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM attachments a
                JOIN runs r ON a.run_id = r.id 
                WHERE r.thread_id = ?
            `);

            const feedbackCount = feedbackStmt.get(thread.thread_id) as any;
            const attachmentCount = attachmentStmt.get(thread.thread_id) as any;

            return {
                thread_id: thread.thread_id,
                total_runs: thread.total_runs,
                total_traces: thread.total_traces,
                total_feedback: feedbackCount.count,
                total_attachments: attachmentCount.count,
                first_run_time: thread.first_run_time,
                last_run_time: thread.last_run_time,
                run_types: thread.run_types
                    ? thread.run_types.split(",").filter(Boolean)
                    : [],
                systems: thread.systems
                    ? thread.systems.split(",").filter(Boolean)
                    : [],
                total_tokens_sum: thread.total_tokens_sum || 0,
            };
        });
    }

    // 获取所有系统列表
    getAllSystems(): string[] {
        const stmt = this.adapter.prepare(`
            SELECT DISTINCT system 
            FROM runs 
            WHERE system IS NOT NULL AND system != ''
            ORDER BY system
        `);
        const results = stmt.all() as { system: string }[];
        return results.map((r) => r.system);
    }

    // 获取所有线程ID列表
    getAllThreadIds(): string[] {
        const stmt = this.adapter.prepare(`
            SELECT DISTINCT thread_id 
            FROM runs 
            WHERE thread_id IS NOT NULL AND thread_id != ''
            ORDER BY thread_id
        `);
        const results = stmt.all() as { thread_id: string }[];
        return results.map((r) => r.thread_id);
    }

    getFeedbackByRunId(runId: string): FeedbackRecord[] {
        const stmt = this.adapter.prepare(
            "SELECT * FROM feedback WHERE run_id = ? ORDER BY created_at",
        );
        return stmt.all(runId) as FeedbackRecord[];
    }

    getAttachmentsByRunId(runId: string): AttachmentRecord[] {
        const stmt = this.adapter.prepare(
            "SELECT * FROM attachments WHERE run_id = ? ORDER BY created_at",
        );
        return stmt.all(runId) as AttachmentRecord[];
    }

    // 事务操作
    createTransaction<T extends any[], R>(
        fn: (...args: T) => R,
    ): (...args: T) => R {
        return this.adapter.transaction(fn);
    }

    close(): void {
        this.adapter.close();
    }
}

// PostgreSQL 工厂函数（需要安装 pg 模块）
export function createPgTraceDatabase(config: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
    ssl?: boolean | object;
}): TraceDatabase {
    try {
        const { PgAdapter } = require("./adapters/pg-adapter.js");
        const adapter = new PgAdapter(config);
        return new TraceDatabase(adapter);
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        throw new Error(
            "无法创建 PostgreSQL 数据库连接。请确保已安装依赖：\n" +
                "npm install pg @types/pg deasync @types/deasync\n" +
                "错误详情: " +
                errorMessage,
        );
    }
}
