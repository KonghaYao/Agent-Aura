import { v4 as uuidv4 } from "uuid";
import type { RunPayload, FeedbackPayload } from "./multipart-types.js";

const formatTimestamp = (time: string | void) => {
    if (time) {
        return new Date(time).getTime().toFixed(0);
    }
    return;
};

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
    model_name?: string; // 新增字段：模型名称
    time_to_first_token?: number; // 新增字段：首个 token 时间
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
    exec(sql: string): Promise<void>;
    prepare(sql: string): Promise<PreparedStatement>;
    transaction<T extends any[], R>(
        fn: (...args: T) => Promise<R>,
    ): Promise<(...args: T) => Promise<R>>;
    close(): Promise<void>;
    getStringAggregateFunction(
        column: string,
        distinct: boolean,
        delimiter: string,
    ): string;
    getPlaceholder(index: number): string;
}

// 预处理语句接口
export interface PreparedStatement {
    run(params?: any[]): Promise<{ changes: number }>;
    get(params?: any): Promise<any>;
    all(params?: any): Promise<any[]>;
}

export class TraceDatabase {
    private adapter: DatabaseAdapter;

    constructor(adapter: DatabaseAdapter) {
        this.adapter = adapter;
        // 注意：构造函数中不能直接调用异步方法
        // 需要在使用前调用 init() 方法
    }

    // 初始化方法，需要在使用数据库前调用
    async init(): Promise<void> {
        await this.initTables();
    }

    // 从 outputs 字段中提取 total_tokens 的辅助方法
    private extractTotalTokensFromOutputs(outputs?: string | object): number {
        if (!outputs) return 0;
        try {
            const outputData =
                typeof outputs === "string" ? JSON.parse(outputs) : outputs;

            if (outputData?.llmOutput?.tokenUsage) {
                const result = outputData.llmOutput.tokenUsage.totalTokens;
                if (result === null || result === undefined) {
                    // 如果 totalTokens 为 null 或 undefined，则赋值为 5
                }
                return result || 0;
            } else if (outputData.generations) {
                return outputData.generations.reduce(
                    (col: number, cur: any) => {
                        const sum = cur
                            .map((i: any) => i.message)
                            .reduce((sum: number, i: any) => {
                                return (
                                    sum +
                                    (i?.kwargs?.usage_metadata?.total_tokens ||
                                        0)
                                );
                            }, 0);
                        return col + sum;
                    },
                    0,
                );
            }
        } catch (error) {
            console.warn("解析 outputs 提取 total_tokens 时出错:", error);
        }
        return 0;
    }

    // 从 events 字段中提取 time_to_first_token 的辅助方法
    private extractTimeToFirstTokenFromEvents(
        events?: string | object,
    ): number {
        if (!events) return 0;
        try {
            const eventsData =
                typeof events === "string" ? JSON.parse(events) : events;
            if (Array.isArray(eventsData) && eventsData.length >= 2) {
                const firstEventTime = new Date(eventsData[0].time).getTime();
                const secondEventTime = new Date(eventsData[1].time).getTime();
                return secondEventTime - firstEventTime;
            }
        } catch (error) {
            console.warn("解析 events 提取 time_to_first_token 时出错:", error);
        }
        return 0;
    }

    // 从 outputs 字段中提取 model_name 的辅助方法
    private extractModelNameFromOutputs(
        outputs?: string | object,
    ): string | undefined {
        if (!outputs) return undefined;
        try {
            const outputData =
                typeof outputs === "string" ? JSON.parse(outputs) : outputs;
            const outputGenerations = outputData?.generations?.[0]?.[0];
            return (
                outputGenerations?.generationInfo ||
                outputGenerations?.generation_info
            )?.model_name;
        } catch (error) {
            console.warn("解析 outputs 提取 model_name 时出错:", error);
            return undefined;
        }
    }

    private async initTables(): Promise<void> {
        // 创建 runs 表
        await this.adapter.exec(`
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
                model_name TEXT,
                time_to_first_token INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        // 创建 feedback 表
        await this.adapter.exec(`
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
        await this.adapter.exec(`
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
        await this.adapter.exec(`
            CREATE INDEX IF NOT EXISTS idx_runs_trace_id ON runs (trace_id);
            CREATE INDEX IF NOT EXISTS idx_runs_thread_id ON runs (thread_id);
            CREATE INDEX IF NOT EXISTS idx_runs_model_name ON runs (model_name);
            CREATE INDEX IF NOT EXISTS idx_runs_system ON runs (system);
            CREATE INDEX IF NOT EXISTS idx_runs_run_type ON runs (run_type);
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
    async getAllTraces(): Promise<TraceOverview[]> {
        const stmt = await this.adapter.prepare(`
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

        const traces = (await stmt.all()) as any[];

        return Promise.all(
            traces.map(async (trace: any) => {
                // 获取该 trace 的 feedback 和 attachments 统计
                const feedbackStmt = await this.adapter.prepare(`
                SELECT COUNT(*) as count FROM feedback WHERE trace_id = ${this.adapter.getPlaceholder(
                    1,
                )}
            `);
                const attachmentStmt = await this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM attachments a
                JOIN runs r ON a.run_id = r.id 
                WHERE r.trace_id = ${this.adapter.getPlaceholder(1)}
            `);

                const feedbackCount = (await feedbackStmt.get([
                    trace.trace_id,
                ])) as any;
                const attachmentCount = (await attachmentStmt.get([
                    trace.trace_id,
                ])) as any;

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
            }),
        );
    }

    // Run 操作
    async createRun(runData: RunPayload): Promise<RunRecord> {
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
            start_time: formatTimestamp(runData.start_time),
            end_time: formatTimestamp(runData.end_time),
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
            model_name: runData.outputs
                ? this.extractModelNameFromOutputs(runData.outputs)
                : undefined,
            time_to_first_token: runData.events
                ? this.extractTimeToFirstTokenFromEvents(runData.events)
                : 0,
        };
        const commitData = [
            record.id,
            record.trace_id,
            record.name,
            record.run_type,
            record.system,
            record.model_name,
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
            record.time_to_first_token,
        ];

        const stmt = await this.adapter.prepare(`
            INSERT INTO runs (
                id, trace_id, name, run_type, system, model_name, thread_id, start_time, end_time,
                inputs, outputs, events, error, extra, serialized, total_tokens,
                created_at, updated_at, time_to_first_token
            ) VALUES (${commitData
                .map((item, index) => this.adapter.getPlaceholder(index + 1))
                .join(",")})
        `);

        await stmt.run(commitData);

        return record;
    }

    async updateRun(
        runId: string,
        runData: RunPayload,
    ): Promise<RunRecord | null> {
        const now = new Date().toISOString();
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1; // 用于PostgreSQL的参数索引，对于SQLite将是无用的，但逻辑统一

        if (runData.trace_id !== undefined) {
            updateFields.push(
                `trace_id = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(runData.trace_id);
        }
        if (runData.name !== undefined) {
            updateFields.push(
                `name = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(runData.name);
        }
        if (runData.run_type !== undefined) {
            updateFields.push(
                `run_type = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(runData.run_type);
        }
        if (runData.system !== undefined) {
            updateFields.push(
                `system = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(runData.system);
        }
        if (runData.start_time !== undefined) {
            updateFields.push(
                `start_time = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(formatTimestamp(runData.start_time));
        }
        if (runData.end_time !== undefined) {
            updateFields.push(
                `end_time = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(formatTimestamp(runData.end_time));
        }
        if (runData.inputs !== undefined) {
            updateFields.push(
                `inputs = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(JSON.stringify(runData.inputs));
        }
        if (runData.outputs !== undefined) {
            updateFields.push(
                `outputs = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(JSON.stringify(runData.outputs));

            // 如果 outputs 被更新，重新计算并更新 total_tokens
            updateFields.push(
                `total_tokens = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(
                this.extractTotalTokensFromOutputs(runData.outputs),
            );

            // 如果 outputs 被更新，重新计算并更新 model_name
            updateFields.push(
                `model_name = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(
                this.extractModelNameFromOutputs(runData.outputs),
            );
        } else if (runData.total_tokens !== undefined) {
            updateFields.push(
                `total_tokens = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(runData.total_tokens);
        }

        // 如果 runData.model_name 存在且 runData.outputs 未定义（即 outputs 未被更新）
        // 并且模型名称需要单独更新，则添加 model_name 到更新字段
        if (runData.model_name !== undefined && runData.outputs === undefined) {
            updateFields.push(
                `model_name = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(runData.model_name);
        }

        if (runData.events !== undefined) {
            updateFields.push(
                `events = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(JSON.stringify(runData.events));
            // 如果 events 被更新，重新计算并更新 time_to_first_token
            updateFields.push(
                `time_to_first_token = ${this.adapter.getPlaceholder(
                    paramIndex++,
                )}`,
            );
            updateValues.push(
                this.extractTimeToFirstTokenFromEvents(runData.events),
            );
        }
        if (runData.error !== undefined) {
            updateFields.push(
                `error = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(JSON.stringify(runData.error));
        }
        if (runData.extra !== undefined) {
            updateFields.push(
                `extra = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(JSON.stringify(runData.extra));

            // 如果更新了 extra 且没有直接提供 thread_id，尝试从 extra 中提取
            if (runData.thread_id === undefined) {
                const threadId = this.extractThreadIdFromExtra(runData.extra);
                if (threadId) {
                    updateFields.push(
                        `thread_id = ${this.adapter.getPlaceholder(
                            paramIndex++,
                        )}`,
                    );
                    updateValues.push(threadId);
                }
            }
        }
        if (runData.thread_id !== undefined) {
            updateFields.push(
                `thread_id = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(runData.thread_id);
        }
        if (runData.serialized !== undefined) {
            updateFields.push(
                `serialized = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(JSON.stringify(runData.serialized));
        }
        if (runData.total_tokens !== undefined) {
            updateFields.push(
                `total_tokens = ${this.adapter.getPlaceholder(paramIndex++)}`,
            );
            updateValues.push(runData.total_tokens);
        }

        if (updateFields.length === 0) {
            return this.getRun(runId);
        }

        updateFields.push(
            `updated_at = ${this.adapter.getPlaceholder(paramIndex++)}`,
        );
        updateValues.push(now);
        updateValues.push(runId); // runId 是 WHERE 子句的最后一个参数

        const stmt = await this.adapter.prepare(`
            UPDATE runs SET ${updateFields.join(
                ", ",
            )} WHERE id = ${this.adapter.getPlaceholder(paramIndex)}
        `);

        const result = await stmt.run(updateValues);

        if (result.changes === 0) {
            return null;
        }

        return this.getRun(runId);
    }

    async updateRunField(
        runId: string,
        field: string,
        value: any,
    ): Promise<RunRecord | null> {
        const now = new Date().toISOString();
        const jsonValue = JSON.stringify(value);

        // field = $1, updated_at = $2, WHERE id = $3
        const stmt = await this.adapter.prepare(`
            UPDATE runs SET ${field} = ${this.adapter.getPlaceholder(
            1,
        )}, updated_at = ${this.adapter.getPlaceholder(
            2,
        )} WHERE id = ${this.adapter.getPlaceholder(3)}
        `);

        const result = await stmt.run([jsonValue, now, runId]);

        if (field === "outputs") {
            const total_tokens = this.extractTotalTokensFromOutputs(value);
            await this.updateRunField(runId, "total_tokens", total_tokens);
            const model_name = this.extractModelNameFromOutputs(value);
            await this.updateRunField(runId, "model_name", model_name);
        }
        if (field === "events") {
            const time_to_first_token =
                this.extractTimeToFirstTokenFromEvents(value);
            await this.updateRunField(
                runId,
                "time_to_first_token",
                time_to_first_token,
            );
        }

        if (result.changes === 0) {
            return null;
        }

        return this.getRun(runId);
    }

    async getRun(runId: string): Promise<RunRecord | null> {
        const stmt = await this.adapter.prepare(
            `SELECT * FROM runs WHERE id = ${this.adapter.getPlaceholder(1)}`,
        );
        const result = (await stmt.get([runId])) as RunRecord;
        return result || null;
    }

    // Feedback 操作
    async createFeedback(
        runId: string,
        feedbackData: FeedbackPayload,
    ): Promise<FeedbackRecord> {
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

        const stmt = await this.adapter.prepare(`
            INSERT INTO feedback (
                id, trace_id, run_id, feedback_id, score, comment, metadata, created_at
            ) VALUES (${this.adapter.getPlaceholder(
                1,
            )}, ${this.adapter.getPlaceholder(
            2,
        )}, ${this.adapter.getPlaceholder(3)}, ${this.adapter.getPlaceholder(
            4,
        )}, ${this.adapter.getPlaceholder(5)}, ${this.adapter.getPlaceholder(
            6,
        )}, ${this.adapter.getPlaceholder(7)}, ${this.adapter.getPlaceholder(
            8,
        )})
        `);

        await stmt.run([
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
    async createAttachment(
        runId: string,
        filename: string,
        contentType: string,
        fileSize: number,
        storagePath: string,
    ): Promise<AttachmentRecord> {
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

        const stmt = await this.adapter.prepare(`
            INSERT INTO attachments (
                id, run_id, filename, content_type, file_size, storage_path, created_at
            ) VALUES (${this.adapter.getPlaceholder(
                1,
            )}, ${this.adapter.getPlaceholder(
            2,
        )}, ${this.adapter.getPlaceholder(3)}, ${this.adapter.getPlaceholder(
            4,
        )}, ${this.adapter.getPlaceholder(5)}, ${this.adapter.getPlaceholder(
            6,
        )}, ${this.adapter.getPlaceholder(7)})
        `);

        await stmt.run([
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
    async getRunsByTraceId(traceId: string): Promise<RunRecord[]> {
        const stmt = await this.adapter.prepare(
            `SELECT * FROM runs WHERE trace_id = ${this.adapter.getPlaceholder(
                1,
            )} ORDER BY created_at`,
        );
        return (await stmt.all([traceId])) as RunRecord[];
    }

    // 根据系统过滤获取 traces
    async getTracesBySystem(system: string): Promise<TraceOverview[]> {
        const stmt = await this.adapter.prepare(`
            SELECT 
                trace_id,
                COUNT(*) as total_runs,
                MIN(start_time) as first_run_time,
                MAX(end_time) as last_run_time,
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
            WHERE trace_id IS NOT NULL AND system = ${this.adapter.getPlaceholder(
                1,
            )}
            GROUP BY trace_id 
            ORDER BY MAX(created_at) DESC
        `);

        const traces = (await stmt.all([system])) as any[];

        return Promise.all(
            traces.map(async (trace: any) => {
                // 获取该 trace 的 feedback 和 attachments 统计
                const feedbackStmt = await this.adapter.prepare(`
                SELECT COUNT(*) as count FROM feedback WHERE trace_id = ${this.adapter.getPlaceholder(
                    1,
                )}
            `);
                const attachmentStmt = await this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM attachments a
                JOIN runs r ON a.run_id = r.id 
                WHERE r.trace_id = ${this.adapter.getPlaceholder(1)}
            `);

                const feedbackCount = (await feedbackStmt.get([
                    trace.trace_id,
                ])) as any;
                const attachmentCount = (await attachmentStmt.get([
                    trace.trace_id,
                ])) as any;

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
            }),
        );
    }

    // 根据系统获取 runs
    async getRunsBySystem(system: string): Promise<RunRecord[]> {
        const stmt = await this.adapter.prepare(
            `SELECT * FROM runs WHERE system = ${this.adapter.getPlaceholder(
                1,
            )} ORDER BY created_at DESC`,
        );
        return (await stmt.all([system])) as RunRecord[];
    }

    // 根据线程ID获取 runs
    async getRunsByThreadId(threadId: string): Promise<RunRecord[]> {
        const stmt = await this.adapter.prepare(
            `SELECT * FROM runs WHERE thread_id = ${this.adapter.getPlaceholder(
                1,
            )} ORDER BY created_at DESC`,
        );
        return (await stmt.all([threadId])) as RunRecord[];
    }

    // 根据线程ID获取相关的 traces
    async getTracesByThreadId(threadId: string): Promise<TraceOverview[]> {
        const stmt = await this.adapter.prepare(`
            SELECT 
                trace_id,
                COUNT(*) as total_runs,
                MIN(start_time) as first_run_time,
                MAX(end_time) as last_run_time,
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
            WHERE trace_id IS NOT NULL AND thread_id = ${this.adapter.getPlaceholder(
                1,
            )}
            GROUP BY trace_id 
            ORDER BY MAX(created_at) DESC
        `);

        const traces = (await stmt.all([threadId])) as any[];

        return Promise.all(
            traces.map(async (trace: any) => {
                // 获取该 trace 的 feedback 和 attachments 统计
                const feedbackStmt = await this.adapter.prepare(`
                SELECT COUNT(*) as count FROM feedback WHERE trace_id = ${this.adapter.getPlaceholder(
                    1,
                )}
            `);
                const attachmentStmt = await this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM attachments a
                JOIN runs r ON a.run_id = r.id 
                WHERE r.trace_id = ${this.adapter.getPlaceholder(1)}
            `);

                const feedbackCount = (await feedbackStmt.get([
                    trace.trace_id,
                ])) as any;
                const attachmentCount = (await attachmentStmt.get([
                    trace.trace_id,
                ])) as any;

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
            }),
        );
    }

    // 获取线程ID概览信息
    async getThreadOverviews(): Promise<
        Array<{
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
        }>
    > {
        const stmt = await this.adapter.prepare(`
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

        const threads = (await stmt.all()) as any[];

        return Promise.all(
            threads.map(async (thread: any) => {
                // 获取该 thread 的 feedback 和 attachments 统计
                const feedbackStmt = await this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM feedback f
                JOIN runs r ON f.run_id = r.id 
                WHERE r.thread_id = ${this.adapter.getPlaceholder(1)}
            `);
                const attachmentStmt = await this.adapter.prepare(`
                SELECT COUNT(*) as count 
                FROM attachments a
                JOIN runs r ON a.run_id = r.id 
                WHERE r.thread_id = ${this.adapter.getPlaceholder(1)}
            `);

                const feedbackCount = (await feedbackStmt.get([
                    thread.thread_id,
                ])) as any;
                const attachmentCount = (await attachmentStmt.get([
                    thread.thread_id,
                ])) as any;

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
            }),
        );
    }

    // 获取所有系统列表
    async getAllSystems(): Promise<string[]> {
        const stmt = await this.adapter.prepare(`
            SELECT DISTINCT system 
            FROM runs 
            WHERE system IS NOT NULL AND system != ''
            ORDER BY system
        `);
        const results = (await stmt.all()) as { system: string }[];
        return results.map((r) => r.system);
    }

    // 获取所有线程ID列表
    async getAllThreadIds(): Promise<string[]> {
        const stmt = await this.adapter.prepare(`
            SELECT DISTINCT thread_id 
            FROM runs 
            WHERE thread_id IS NOT NULL AND thread_id != ''
            ORDER BY thread_id
        `);
        const results = (await stmt.all()) as { thread_id: string }[];
        return results.map((r) => r.thread_id);
    }

    // 获取指定 run_type 的 runs，支持分页
    async getRunsByRunType(
        runType: string,
        limit: number,
        offset: number,
    ): Promise<RunRecord[]> {
        const stmt = await this.adapter.prepare(`
            SELECT * FROM runs
            WHERE run_type = ${this.adapter.getPlaceholder(1)}
            ORDER BY created_at DESC
            LIMIT ${this.adapter.getPlaceholder(
                2,
            )} OFFSET ${this.adapter.getPlaceholder(3)}
        `);
        return (await stmt.all([runType, limit, offset])) as RunRecord[];
    }

    // 获取指定 run_type 的总记录数
    async countRunsByRunType(runType: string): Promise<number> {
        const stmt = await this.adapter.prepare(`
            SELECT COUNT(*) as count
            FROM runs
            WHERE run_type = ${this.adapter.getPlaceholder(1)}
        `);
        const result = (await stmt.get([runType])) as { count: number };
        return result.count || 0;
    }

    async getFeedbackByRunId(runId: string): Promise<FeedbackRecord[]> {
        const stmt = await this.adapter.prepare(
            `SELECT * FROM feedback WHERE run_id = ${this.adapter.getPlaceholder(
                1,
            )} ORDER BY created_at`,
        );
        return (await stmt.all([runId])) as FeedbackRecord[];
    }

    async getAttachmentsByRunId(runId: string): Promise<AttachmentRecord[]> {
        const stmt = await this.adapter.prepare(
            `SELECT * FROM attachments WHERE run_id = ${this.adapter.getPlaceholder(
                1,
            )} ORDER BY created_at`,
        );
        return (await stmt.all([runId])) as AttachmentRecord[];
    }

    // 事务操作
    async createTransaction<T extends any[], R>(
        fn: (...args: T) => Promise<R>,
    ): Promise<(...args: T) => Promise<R>> {
        return await this.adapter.transaction(fn);
    }

    async close(): Promise<void> {
        return await this.adapter.close();
    }
}
