import { Database } from "bun:sqlite";
import { v4 as uuidv4 } from "uuid";
import type { RunPayload, FeedbackPayload } from "./multipart-types.js";

export interface RunRecord {
    id: string;
    trace_id?: string;
    name?: string;
    run_type?: string;
    start_time?: string;
    end_time?: string;
    inputs?: string; // JSON string
    outputs?: string; // JSON string
    events?: string; // JSON string
    error?: string; // JSON string
    extra?: string; // JSON string
    serialized?: string; // JSON string
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
}

export class TraceDatabase {
    private db: Database;

    constructor(dbPath: string = "trace.db") {
        this.db = new Database(dbPath);
        this.initTables();
    }

    private initTables(): void {
        // 开启 WAL 模式以提高性能
        this.db.exec("PRAGMA journal_mode = WAL;");

        // 创建 runs 表
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                trace_id TEXT,
                name TEXT,
                run_type TEXT,
                start_time TEXT,
                end_time TEXT,
                inputs TEXT,
                outputs TEXT,
                events TEXT,
                error TEXT,
                extra TEXT,
                serialized TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        // 创建 feedback 表
        this.db.exec(`
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
        this.db.exec(`
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
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_runs_trace_id ON runs (trace_id);
            CREATE INDEX IF NOT EXISTS idx_feedback_trace_id ON feedback (trace_id);
            CREATE INDEX IF NOT EXISTS idx_feedback_run_id ON feedback (run_id);
            CREATE INDEX IF NOT EXISTS idx_attachments_run_id ON attachments (run_id);
        `);
    }

    // 获取所有 traceId 及其概要信息
    getAllTraces(): TraceOverview[] {
        const stmt = this.db.prepare(`
            SELECT 
                trace_id,
                COUNT(*) as total_runs,
                MIN(created_at) as first_run_time,
                MAX(created_at) as last_run_time,
                GROUP_CONCAT(DISTINCT run_type) as run_types
            FROM runs 
            WHERE trace_id IS NOT NULL 
            GROUP BY trace_id 
            ORDER BY MAX(created_at) DESC
        `);

        const traces = stmt.all() as any[];

        return traces.map((trace) => {
            // 获取该 trace 的 feedback 和 attachments 统计
            const feedbackStmt = this.db.prepare(`
                SELECT COUNT(*) as count FROM feedback WHERE trace_id = ?
            `);
            const attachmentStmt = this.db.prepare(`
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
            };
        });
    }

    // Run 操作
    createRun(runData: RunPayload): RunRecord {
        const id = runData.id || uuidv4();
        const now = new Date().toISOString();

        const record: RunRecord = {
            id,
            trace_id: runData.trace_id,
            name: runData.name,
            run_type: runData.run_type,
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
        };

        const stmt = this.db.prepare(`
            INSERT INTO runs (
                id, trace_id, name, run_type, start_time, end_time,
                inputs, outputs, events, error, extra, serialized,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run([
            record.id,
            record.trace_id,
            record.name,
            record.run_type,
            record.start_time,
            record.end_time,
            record.inputs,
            record.outputs,
            record.events,
            record.error,
            record.extra,
            record.serialized,
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
        }
        if (runData.serialized !== undefined) {
            updateFields.push("serialized = ?");
            updateValues.push(JSON.stringify(runData.serialized));
        }

        if (updateFields.length === 0) {
            return this.getRun(runId);
        }

        updateFields.push("updated_at = ?");
        updateValues.push(now);
        updateValues.push(runId);

        const stmt = this.db.prepare(`
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

        const stmt = this.db.prepare(`
            UPDATE runs SET ${field} = ?, updated_at = ? WHERE id = ?
        `);

        const result = stmt.run([jsonValue, now, runId]);

        if (result.changes === 0) {
            return null;
        }

        return this.getRun(runId);
    }

    getRun(runId: string): RunRecord | null {
        const stmt = this.db.prepare("SELECT * FROM runs WHERE id = ?");
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

        const stmt = this.db.prepare(`
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

        const stmt = this.db.prepare(`
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
        const stmt = this.db.prepare(
            "SELECT * FROM runs WHERE trace_id = ? ORDER BY created_at",
        );
        return stmt.all(traceId) as RunRecord[];
    }

    getFeedbackByRunId(runId: string): FeedbackRecord[] {
        const stmt = this.db.prepare(
            "SELECT * FROM feedback WHERE run_id = ? ORDER BY created_at",
        );
        return stmt.all(runId) as FeedbackRecord[];
    }

    getAttachmentsByRunId(runId: string): AttachmentRecord[] {
        const stmt = this.db.prepare(
            "SELECT * FROM attachments WHERE run_id = ? ORDER BY created_at",
        );
        return stmt.all(runId) as AttachmentRecord[];
    }

    // 事务操作
    createTransaction<T extends any[], R>(
        fn: (...args: T) => R,
    ): (...args: T) => R {
        return this.db.transaction(fn);
    }

    close(): void {
        this.db.close();
    }
}
