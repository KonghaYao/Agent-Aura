// PostgreSQL 适配器
// 安装依赖: npm install pg @types/pg

import type { DatabaseAdapter, PreparedStatement } from "../database.js";
import pg, { Pool, type PoolConfig } from "pg";

// PostgreSQL 准备语句实现
class PgPreparedStatement implements PreparedStatement {
    private pool: Pool;
    private sql: string;

    constructor(pool: Pool, sql: string) {
        this.pool = pool;
        this.sql = sql;
    }

    async run(params?: any[]): Promise<{ changes: number }> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(this.sql, params);
            return { changes: result.rowCount || 0 };
        } finally {
            client.release();
        }
    }

    async get(params?: any): Promise<any> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(this.sql, params);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    async all(params?: any): Promise<any[]> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(this.sql, params);
            return result.rows;
        } finally {
            client.release();
        }
    }
}

// PostgreSQL 适配器实现
export class PgAdapter implements DatabaseAdapter {
    private pool: Pool;

    constructor(config: PoolConfig) {
        this.pool = new pg.Pool(config);
    }

    async exec(sql: string): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(sql);
        } finally {
            client.release();
        }
    }

    async prepare(sql: string): Promise<PreparedStatement> {
        return new PgPreparedStatement(this.pool, sql);
    }

    async transaction<T extends any[], R>(
        fn: (...args: T) => Promise<R>,
    ): Promise<(...args: T) => Promise<R>> {
        return async (...args: T): Promise<R> => {
            const client = await this.pool.connect();
            try {
                await client.query("BEGIN");
                const result = await fn(...args);
                await client.query("COMMIT");
                return result;
            } catch (error) {
                await client.query("ROLLBACK");
                throw error;
            } finally {
                client.release();
            }
        };
    }

    async close(): Promise<void> {
        await this.pool.end();
    }

    getStringAggregateFunction(
        column: string,
        distinct: boolean,
        delimiter: string,
    ): string {
        return `string_agg(${column}, '${delimiter}')`;
    }
}

// 导出类型
export type { PoolConfig };
