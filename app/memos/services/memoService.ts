import { Memo, SearchResult } from "../types";
import { getDatabase, MemoDocument } from "./database";

// 将 RxDB 文档转换为 Memo 接口
function documentToMemo(doc: MemoDocument): Memo {
    return {
        key: doc.key,
        text: doc.text,
    };
}

export async function getMemo(key: string): Promise<Memo> {
    try {
        const db = await getDatabase();
        const doc = await db.memos
            .findOne({
                selector: {
                    key: key,
                },
            })
            .exec();

        if (!doc) {
            throw new Error(`备忘录 "${key}" 未找到`);
        }

        return documentToMemo(doc.toJSON());
    } catch (error) {
        console.error("获取备忘录失败:", error);
        throw new Error("获取备忘录失败");
    }
}

export async function searchMemos(
    query: string = "",
    limit: number = 50,
): Promise<Memo[]> {
    try {
        const db = await getDatabase();

        let findQuery;

        if (query.trim()) {
            // 如果有查询条件，搜索key或text包含关键词的备忘录
            findQuery = db.memos.find({
                selector: {
                    $or: [
                        {
                            key: {
                                $regex: `.*${query}.*`,
                            },
                        },
                        {
                            text: {
                                $regex: `.*${query}.*`,
                            },
                        },
                    ],
                },
                sort: [{ updatedAt: "desc" }],
                limit: limit,
            });
        } else {
            // 如果没有查询条件，返回所有备忘录（按更新时间倒序）
            findQuery = db.memos.find({
                sort: [{ updatedAt: "desc" }],
                limit: limit,
            });
        }

        const docs = await findQuery.exec();
        return docs.map((doc) => documentToMemo(doc.toJSON()));
    } catch (error) {
        console.error("搜索备忘录失败:", error);
        throw new Error("搜索备忘录失败");
    }
}

export async function createMemo(key: string, value: string): Promise<void> {
    try {
        const db = await getDatabase();

        // 检查是否已存在相同key的备忘录
        const existing = await db.memos
            .findOne({
                selector: { key },
            })
            .exec();

        if (existing) {
            throw new Error(`备忘录 "${key}" 已存在`);
        }

        const now = Date.now();
        await db.memos.insert({
            key,
            text: value,
            createdAt: now,
            updatedAt: now,
        });
    } catch (error) {
        console.error("创建备忘录失败:", error);
        if (error instanceof Error && error.message.includes("已存在")) {
            throw error;
        }
        throw new Error("创建备忘录失败");
    }
}

export async function updateMemo(key: string, value: string): Promise<void> {
    try {
        const db = await getDatabase();

        const doc = await db.memos
            .findOne({
                selector: { key },
            })
            .exec();

        if (!doc) {
            throw new Error(`备忘录 "${key}" 未找到`);
        }

        await doc.update({
            $set: {
                text: value,
                updatedAt: Date.now(),
            },
        });
    } catch (error) {
        console.error("更新备忘录失败:", error);
        if (error instanceof Error && error.message.includes("未找到")) {
            throw error;
        }
        throw new Error("更新备忘录失败");
    }
}

export async function deleteMemo(key: string): Promise<void> {
    try {
        const db = await getDatabase();

        const doc = await db.memos
            .findOne({
                selector: { key },
            })
            .exec();

        if (!doc) {
            throw new Error(`备忘录 "${key}" 未找到`);
        }

        await doc.remove();
    } catch (error) {
        console.error("删除备忘录失败:", error);
        if (error instanceof Error && error.message.includes("未找到")) {
            throw error;
        }
        throw new Error("删除备忘录失败");
    }
}

// 额外的工具函数

// 获取所有备忘录数量
export async function getMemosCount(): Promise<number> {
    try {
        const db = await getDatabase();
        const result = await db.memos.count().exec();
        return result;
    } catch (error) {
        console.error("获取备忘录数量失败:", error);
        return 0;
    }
}

// 批量删除备忘录
export async function deleteMemos(keys: string[]): Promise<void> {
    try {
        const db = await getDatabase();

        const docs = await db.memos
            .find({
                selector: {
                    key: {
                        $in: keys,
                    },
                },
            })
            .exec();

        await Promise.all(docs.map((doc) => doc.remove()));
    } catch (error) {
        console.error("批量删除备忘录失败:", error);
        throw new Error("批量删除备忘录失败");
    }
}

// 清空所有备忘录
export async function clearAllMemos(): Promise<void> {
    try {
        const db = await getDatabase();
        const allMemos = await db.memos.find().exec();
        await Promise.all(allMemos.map((memo) => memo.remove()));
    } catch (error) {
        console.error("清空备忘录失败:", error);
        throw new Error("清空备忘录失败");
    }
}

// 备份和恢复功能

// 备份数据接口
export interface BackupData {
    version: string;
    timestamp: number;
    memos: MemoDocument[];
    metadata: {
        totalCount: number;
        exportDate: string;
        appVersion: string;
    };
}

// 导出所有备忘录为备份数据
export async function exportBackup(): Promise<BackupData> {
    try {
        const db = await getDatabase();
        const docs = await db.memos
            .find({
                sort: [{ createdAt: "asc" }],
            })
            .exec();

        const memos = docs.map((doc) => doc.toJSON());
        const now = Date.now();

        const backupData: BackupData = {
            version: "1.0",
            timestamp: now,
            memos: memos,
            metadata: {
                totalCount: memos.length,
                exportDate: new Date(now).toISOString(),
                appVersion: "1.0.0",
            },
        };

        return backupData;
    } catch (error) {
        console.error("导出备忘录失败:", error);
        throw new Error("导出备忘录失败");
    }
}

// 下载备份文件
export async function downloadBackup(): Promise<void> {
    try {
        const backupData = await exportBackup();
        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:.]/g, "-");
        link.download = `memos-backup-${timestamp}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("下载备份文件失败:", error);
        throw new Error("下载备份文件失败");
    }
}

// 验证备份数据格式
function validateBackupData(data: any): data is BackupData {
    return (
        data &&
        typeof data === "object" &&
        typeof data.version === "string" &&
        typeof data.timestamp === "number" &&
        Array.isArray(data.memos) &&
        data.metadata &&
        typeof data.metadata.totalCount === "number"
    );
}

// 验证备忘录数据格式
function validateMemoData(memo: any): boolean {
    return (
        memo &&
        typeof memo === "object" &&
        typeof memo.key === "string" &&
        typeof memo.text === "string" &&
        typeof memo.createdAt === "number" &&
        typeof memo.updatedAt === "number"
    );
}

// 从备份数据恢复备忘录
export async function importBackup(
    backupData: BackupData,
    options: {
        clearExisting?: boolean;
        skipDuplicates?: boolean;
        updateExisting?: boolean;
    } = {},
): Promise<{
    imported: number;
    skipped: number;
    updated: number;
    errors: string[];
}> {
    const {
        clearExisting = false,
        skipDuplicates = true,
        updateExisting = false,
    } = options;

    try {
        // 验证备份数据格式
        if (!validateBackupData(backupData)) {
            throw new Error("备份数据格式无效");
        }

        const db = await getDatabase();
        let imported = 0;
        let skipped = 0;
        let updated = 0;
        const errors: string[] = [];

        // 如果需要清空现有数据
        if (clearExisting) {
            const allMemos = await db.memos.find().exec();
            await Promise.all(allMemos.map((memo) => memo.remove()));
        }

        // 导入备忘录
        for (const memo of backupData.memos) {
            try {
                // 验证备忘录数据格式
                if (!validateMemoData(memo)) {
                    errors.push(
                        `备忘录 "${memo.key || "unknown"}" 数据格式无效`,
                    );
                    continue;
                }

                // 检查是否已存在
                const existing = await db.memos
                    .findOne({
                        selector: { key: memo.key },
                    })
                    .exec();

                if (existing) {
                    if (updateExisting) {
                        // 更新现有备忘录
                        await existing.update({
                            $set: {
                                text: memo.text,
                                updatedAt: Date.now(),
                            },
                        });
                        updated++;
                    } else if (skipDuplicates) {
                        // 跳过重复项
                        skipped++;
                    } else {
                        errors.push(`备忘录 "${memo.key}" 已存在`);
                    }
                } else {
                    // 插入新备忘录
                    await db.memos.insert({
                        key: memo.key,
                        text: memo.text,
                        createdAt: memo.createdAt,
                        updatedAt: memo.updatedAt,
                    });
                    imported++;
                }
            } catch (itemError) {
                errors.push(
                    `导入备忘录 "${memo.key}" 失败: ${
                        itemError instanceof Error
                            ? itemError.message
                            : String(itemError)
                    }`,
                );
            }
        }

        return {
            imported,
            skipped,
            updated,
            errors,
        };
    } catch (error) {
        console.error("导入备忘录失败:", error);
        throw new Error("导入备忘录失败");
    }
}

// 从文件恢复备忘录
export async function restoreFromFile(
    file: File,
    options: {
        clearExisting?: boolean;
        skipDuplicates?: boolean;
        updateExisting?: boolean;
    } = {},
): Promise<{
    imported: number;
    skipped: number;
    updated: number;
    errors: string[];
}> {
    try {
        // 验证文件类型
        if (!file.type.includes("json") && !file.name.endsWith(".json")) {
            throw new Error("请选择JSON格式的备份文件");
        }

        // 读取文件内容
        const fileContent = await file.text();

        let backupData: BackupData;
        try {
            backupData = JSON.parse(fileContent);
        } catch (parseError) {
            throw new Error("备份文件格式错误，无法解析JSON");
        }

        // 导入数据
        return await importBackup(backupData, options);
    } catch (error) {
        console.error("从文件恢复失败:", error);
        throw error;
    }
}

// 获取备份信息（不实际导入）
export async function getBackupInfo(file: File): Promise<{
    version: string;
    timestamp: number;
    exportDate: string;
    totalCount: number;
    appVersion: string;
}> {
    try {
        if (!file.type.includes("json") && !file.name.endsWith(".json")) {
            throw new Error("请选择JSON格式的备份文件");
        }

        const fileContent = await file.text();
        const backupData = JSON.parse(fileContent);

        if (!validateBackupData(backupData)) {
            throw new Error("备份文件格式无效");
        }

        return {
            version: backupData.version,
            timestamp: backupData.timestamp,
            exportDate: backupData.metadata.exportDate,
            totalCount: backupData.metadata.totalCount,
            appVersion: backupData.metadata.appVersion,
        };
    } catch (error) {
        console.error("读取备份信息失败:", error);
        throw error;
    }
}
