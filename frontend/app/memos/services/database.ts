"use client";
import { createRxDatabase } from "rxdb/plugins/core";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { RxDatabase, RxCollection, RxJsonSchema, RxDocument } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { addRxPlugin } from "rxdb/plugins/core";
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBUpdatePlugin);
// 定义 Memo 文档类型
export interface MemoDocument {
    key: string;
    text: string;
    createdAt: number;
    updatedAt: number;
}

// 定义 RxDB 文档类型
export type MemoDocumentType = RxDocument<MemoDocument>;

// 定义集合类型
export type MemoCollection = RxCollection<MemoDocument>;

// 定义数据库类型
export type MemoDatabase = RxDatabase<{
    memos: MemoCollection;
}>;

// Memo schema
const memoSchema: RxJsonSchema<MemoDocument> = {
    version: 0,
    primaryKey: "key",
    type: "object",
    properties: {
        key: {
            type: "string",
            maxLength: 200,
        },
        text: {
            type: "string",
        },
        createdAt: {
            type: "number",
            multipleOf: 1,
            minimum: 0,
            maximum: 4102444800000, // 2100年1月1日
        },
        updatedAt: {
            type: "number",
            multipleOf: 1,
            minimum: 0,
            maximum: 4102444800000, // 2100年1月1日
        },
    },
    required: ["key", "text", "createdAt", "updatedAt"],
    indexes: ["createdAt", "updatedAt"],
};

let dbPromise: Promise<MemoDatabase> | null = null;

// 获取数据库实例（单例模式）
export async function getDatabase(): Promise<MemoDatabase> {
    if (!dbPromise) {
        dbPromise = createDatabase();
    }
    return dbPromise;
}

// 创建数据库
async function createDatabase(): Promise<MemoDatabase> {
    const database = await createRxDatabase<MemoDatabase>({
        name: "memosdb",
        storage: wrappedValidateAjvStorage({
            storage: getRxStorageDexie(),
        }),
        multiInstance: true,
        eventReduce: true,
        ignoreDuplicate: true,
    });

    // 添加集合
    await database.addCollections({
        memos: {
            schema: memoSchema,
            methods: {
                // 文档方法
                updateText(this: MemoDocumentType, newText: string) {
                    return this.update({
                        $set: {
                            text: newText,
                            updatedAt: Date.now(),
                        },
                    });
                },
            },
            statics: {
                // 集合静态方法
                findByTextPattern(this: MemoCollection, pattern: string) {
                    return this.find({
                        selector: {
                            text: {
                                $regex: pattern,
                            },
                        },
                    });
                },
            },
        },
    });

    return database;
}

// 清理数据库连接
export async function closeDatabase(): Promise<void> {
    if (dbPromise) {
        const db = await dbPromise;
        await db.close();
        dbPromise = null;
    }
}
