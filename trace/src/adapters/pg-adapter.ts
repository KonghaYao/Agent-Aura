// PostgreSQL 适配器
// 安装依赖: npm install pg @types/pg deasync @types/deasync

import type { DatabaseAdapter, PreparedStatement } from "../database.js";
import pg, { Pool, type PoolConfig } from "pg";

// 同步等待函数
function waitForPromise<T>(promise: Promise<T>): T {
    let result: T | undefined;
    let error: any;
    let done = false;

    promise
        .then((res) => {
            result = res;
            done = true;
        })
        .catch((err) => {
            error = err;
            done = true;
        });

    // 使用 deasync 如果可用，否则使用简单的事件循环
    while (!done) {
        try {
            const deasync = require("deasync");
            if (deasync.runLoopOnce) {
                deasync.runLoopOnce();
            } else {
                // 备用方案
                require("child_process").spawnSync("node", [
                    "-e",
                    "setTimeout(() => {}, 1)",
                ]);
            }
        } catch {
            // 如果 deasync 不可用，使用备用方案
            require("child_process").spawnSync("node", [
                "-e",
                "setTimeout(() => {}, 1)",
            ]);
        }
    }

    if (error) {
        throw error;
    }

    return result!;
}

// PostgreSQL 准备语句实现
class PgPreparedStatement implements PreparedStatement {
    private pool: Pool;
    private sql: string;

    constructor(pool: Pool, sql: string) {
        this.pool = pool;
        this.sql = sql;
    }

    run(params?: any[]): { changes: number } {
        return waitForPromise(this.runAsync(params));
    }

    private async runAsync(params?: any[]): Promise<{ changes: number }> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(this.sql, params);
            return { changes: result.rowCount || 0 };
        } finally {
            client.release();
        }
    }

    get(params?: any): any {
        return waitForPromise(this.getAsync(params));
    }

    private async getAsync(params?: any): Promise<any> {
        const client = await this.pool.connect();
        try {
            const result = await client.query(this.sql, params);
            return result.rows[0] || null;
        } finally {
            client.release();
        }
    }

    all(params?: any): any[] {
        return waitForPromise(this.allAsync(params));
    }

    private async allAsync(params?: any): Promise<any[]> {
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

    exec(sql: string): void {
        waitForPromise(this.execAsync(sql));
    }

    private async execAsync(sql: string): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query(sql);
        } finally {
            client.release();
        }
    }

    prepare(sql: string): PreparedStatement {
        return new PgPreparedStatement(this.pool, sql);
    }

    transaction<T extends any[], R>(fn: (...args: T) => R): (...args: T) => R {
        return (...args: T): R => {
            return waitForPromise(this.transactionAsync(fn, ...args));
        };
    }

    private async transactionAsync<T extends any[], R>(
        fn: (...args: T) => R,
        ...args: T
    ): Promise<R> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const result = fn(...args);
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    close(): void {
        waitForPromise(this.closeAsync());
    }

    private async closeAsync(): Promise<void> {
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
