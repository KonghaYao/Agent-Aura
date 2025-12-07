import { Generated, ColumnType, Kysely, PostgresDialect, sql } from "kysely";
import { LangGraphGlobal } from "@langgraph-js/pure-graph";
import { Pool } from "pg";
import { getEnv } from "../utils/getEnv";

export interface Database {
    files: FilesTable;
}

export interface FilesTable {
    id: Generated<number>;
    user_id: string;
    conversation_id: string | null;
    file_name: string;
    file_size: number;
    file_type: string;
    oss_url: string;
    category:
        | "document"
        | "image"
        | "audio-video"
        | "table"
        | "code"
        | "presentation"
        | string
        | null;
    tags: string[];
    is_ai_gen: boolean;
    create_time: ColumnType<Date, Date | undefined, never>;
    update_time: ColumnType<Date, Date | undefined, Date | undefined>;
}

// 类型定义
export type FileInsert = Omit<FilesTable, "id" | "create_time" | "update_time">;
export type FileUpdate = Partial<Omit<FilesTable, "id" | "create_time">>;
export type FileSelect = FilesTable;

/**
 * 文件存储服务类
 */
export class FileStoreService {
    private db!: Kysely<Database>;

    constructor() {
        this.db = new Kysely<Database>({
            dialect: new PostgresDialect({
                pool: async () => {
                    await LangGraphGlobal.initGlobal();
                    return (
                        (LangGraphGlobal.globalCheckPointer as any).pool ||
                        new Pool({
                            connectionString: getEnv("FILE_DATABASE_URL"),
                        })
                    );
                },
            }),
        });
        this.initTable();
    }

    /**
     * 初始化数据库表
     */
    private async initTable(): Promise<void> {
        try {
            // 检查表是否已存在
            const tableExists = await sql<{ exists: boolean }>`
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.tables
                    WHERE table_name = 'files'
                )
            `.execute(this.db);

            if (!tableExists.rows[0]?.exists) {
                // 创建 files 表
                await sql`
                    CREATE TABLE files (
                        id SERIAL PRIMARY KEY,
                        user_id VARCHAR(255) NOT NULL,
                        conversation_id VARCHAR(255),
                        file_name VARCHAR(500) NOT NULL,
                        file_size BIGINT NOT NULL,
                        file_type VARCHAR(100) NOT NULL,
                        oss_url TEXT NOT NULL,
                        category VARCHAR(100),
                        tags TEXT[] DEFAULT '{}',
                        is_ai_gen BOOLEAN DEFAULT false,
                        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `.execute(this.db);

                // 创建索引
                await sql`CREATE INDEX idx_files_user_id ON files(user_id)`.execute(
                    this.db,
                );
                await sql`CREATE INDEX idx_files_conversation_id ON files(conversation_id)`.execute(
                    this.db,
                );
                await sql`CREATE INDEX idx_files_category ON files(category)`.execute(
                    this.db,
                );
                await sql`CREATE INDEX idx_files_create_time ON files(create_time DESC)`.execute(
                    this.db,
                );

                console.log("Files table created successfully");
            }
        } catch (error) {
            console.error("Failed to initialize files table:", error);
            throw error;
        }
    }

    /**
     * 创建文件记录
     */
    async createFile(file: FileInsert): Promise<FileSelect | undefined> {
        const result = await this.db
            .insertInto("files")
            .values({
                ...file,
                create_time: new Date(),
                update_time: new Date(),
            })
            .returningAll()
            .executeTakeFirst();

        return result as FileSelect | undefined;
    }

    /**
     * 根据ID获取文件记录
     */
    async getFileById(id: number): Promise<FileSelect | undefined> {
        const result = await this.db
            .selectFrom("files")
            .where("id", "=", id)
            .selectAll()
            .executeTakeFirst();

        return result as FileSelect | undefined;
    }

    /**
     * 根据用户ID获取文件列表
     */
    async getFilesByUserId(
        userId: string,
        options: {
            limit?: number;
            offset?: number;
            conversationId?: string;
            category?: string;
            tags?: string[];
        } = {},
    ): Promise<FileSelect[]> {
        let query = this.db.selectFrom("files").where("user_id", "=", userId);

        if (options.conversationId) {
            query = query.where("conversation_id", "=", options.conversationId);
        }

        if (options.category) {
            query = query.where("category", "=", options.category);
        }

        if (options.tags && options.tags.length > 0) {
            query = query.where("tags", "@>", options.tags);
        }

        query = query
            .orderBy("create_time", "desc")
            .limit(options.limit || 50)
            .offset(options.offset || 0);

        const result = await query.selectAll().execute();
        return result as unknown as FileSelect[];
    }

    /**
     * 更新文件记录
     */
    async updateFile(
        id: number,
        updates: FileUpdate,
    ): Promise<FileSelect | undefined> {
        const result = await this.db
            .updateTable("files")
            .set({
                ...updates,
                update_time: new Date(),
            })
            .where("id", "=", id)
            .returningAll()
            .executeTakeFirst();

        return result as FileSelect | undefined;
    }

    /**
     * 删除文件记录
     */
    async deleteFile(id: number): Promise<FileSelect | undefined> {
        const result = await this.db
            .deleteFrom("files")
            .where("id", "=", id)
            .returningAll()
            .executeTakeFirst();

        return result as FileSelect | undefined;
    }

    /**
     * 获取用户文件统计
     */
    async getFileStats(userId: string): Promise<{
        totalFiles: number;
        totalSize: number;
        aiGeneratedFiles: number;
    }> {
        const result = await this.db
            .selectFrom("files")
            .where("user_id", "=", userId)
            .select([
                (eb) => eb.fn.count("id").as("total_files"),
                (eb) => eb.fn.sum("file_size").as("total_size"),
                (eb) =>
                    eb.fn
                        .count("id")
                        .filterWhere("is_ai_gen", "=", true)
                        .as("ai_generated_files"),
            ])
            .executeTakeFirst();

        return {
            totalFiles: Number(result?.total_files || 0),
            totalSize: Number(result?.total_size || 0),
            aiGeneratedFiles: Number(result?.ai_generated_files || 0),
        };
    }
}

// 导出服务实例，方便使用
export const fileStoreService = new FileStoreService();
