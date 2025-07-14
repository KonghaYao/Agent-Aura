import { Database } from "bun:sqlite";
import type { DatabaseAdapter, PreparedStatement } from "../database.js";

// SQLite 适配器实现
export class SQLiteAdapter implements DatabaseAdapter {
    private db: Database;

    constructor(dbPath: string = "./.langgraph_api/trace.db") {
        this.db = new Database(dbPath);
        // SQLite 特有：开启 WAL 模式以提高性能
        this.db.exec("PRAGMA journal_mode = WAL;");
    }

    exec(sql: string): void {
        this.db.exec(sql);
    }

    prepare(sql: string): PreparedStatement {
        const stmt = this.db.prepare(sql);
        return {
            run: (params?: any[]) => stmt.run(params),
            get: (params?: any) => stmt.get(params),
            all: (params?: any) => stmt.all(params),
        };
    }

    transaction<T extends any[], R>(fn: (...args: T) => R): (...args: T) => R {
        return this.db.transaction(fn);
    }

    close(): void {
        this.db.close();
    }

    getStringAggregateFunction(
        column: string,
        distinct: boolean,
        delimiter: string,
    ): string {
        return `GROUP_CONCAT(${column}, '${delimiter}')`;
    }
}
