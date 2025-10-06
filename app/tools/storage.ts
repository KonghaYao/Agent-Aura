import { Document, SearchOptions } from "flexsearch";
import IndexedDBStorage from "flexsearch/db/indexeddb";
// 定义标准文档接口
export interface BaseDocument {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createTime: number;
    updateTime?: number;
    version?: number;
    status?: "draft" | "published" | "archived";
    metadata?: Record<string, string | number | boolean>;
}

// 为了兼容 FlexSearch，扩展接口添加索引签名
export interface SearchableDocument extends BaseDocument {
    [key: string]: any;
}

// 定义排序选项
export interface SortOptions {
    field: keyof BaseDocument;
    order: "asc" | "desc";
}

// 定义查询选项
export interface QueryOptions {
    limit?: number;
    offset?: number;
    sort?: SortOptions;
    filter?: Partial<BaseDocument>;
}

// 抽象存储接口 - 定义存储操作的标准接口
export abstract class AbstractStorage<T extends BaseDocument> {
    // 基础 CRUD 操作
    abstract add(
        document: Omit<T, "id" | "createTime" | "updateTime" | "version">,
    ): Promise<T>;
    abstract addBatch(
        documents: Omit<T, "id" | "createTime" | "updateTime" | "version">[],
    ): Promise<T[]>;
    abstract update(
        id: string,
        updates: Partial<Omit<T, "id" | "createTime">>,
    ): Promise<T>;
    abstract remove(id: string): Promise<boolean>;
    abstract getById(id: string): Promise<T | null>;
    abstract clear(): Promise<void>;

    // 批量操作
    abstract updateBatch(
        updates: Array<{
            id: string;
            data: Partial<Omit<T, "id" | "createTime">>;
        }>,
    ): Promise<T[]>;
    abstract removeBatch(ids: string[]): Promise<boolean[]>;

    // 搜索操作
    abstract search(options: SearchOptions): Promise<T[]>;

    // 生命周期
    abstract ready(): Promise<void>;
    abstract close(): void;

    // 事件钩子 - 子类可以重写
    protected async onBeforeAdd(
        document: Omit<T, "id" | "createTime" | "updateTime" | "version">,
    ): Promise<void> {}
    protected async onAfterAdd(document: T): Promise<void> {}
    protected async onBeforeUpdate(
        id: string,
        updates: Partial<Omit<T, "id" | "createTime">>,
    ): Promise<void> {}
    protected async onAfterUpdate(document: T): Promise<void> {}
    protected async onBeforeRemove(id: string): Promise<void> {}
    protected async onAfterRemove(id: string): Promise<void> {}
}

// FlexSearch 配置
export interface SearchConfig {
    encode?: (str: string) => string[];
}

// FlexSearch 存储实现
export class FlexSearchStorage<
    T extends BaseDocument & SearchableDocument,
> extends AbstractStorage<T> {
    private index: Document<SearchableDocument>;
    private searchConfig: SearchConfig;
    private segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });

    constructor(searchConfig: SearchConfig) {
        super();
        this.searchConfig = searchConfig;

        // 初始化 FlexSearch 索引，强制启用存储
        this.index = new Document({
            worker: false,
            document: {
                id: "id",
                store: true,
                index: ["title", "content", "tags"],
            },
            encode: this.defaultEncode.bind(this),
        });
    }

    // 默认中文分词编码器
    private defaultEncode(str: string): string[] {
        return [...this.segmenter.segment(str)]
            .filter((segment) => segment.isWordLike)
            .map((segment) => segment.segment);
    }
    private mounted = false;
    async ready(): Promise<void> {
        if (this.mounted) return;
        this.mounted = true;
        const db = new IndexedDBStorage("flexsearch-db");
        await this.index.mount(db);
        return Promise.resolve();
    }
    waitForCommit() {
        return this.index.commit();
    }

    async add(
        document: Omit<T, "id" | "createTime" | "updateTime" | "version">,
    ): Promise<T> {
        await this.onBeforeAdd(document);

        const now = Date.now();
        const newDocument: T = {
            ...document,
            id: crypto.randomUUID(),
            createTime: now,
            updateTime: now,
            version: 1,
        } as T;

        this.index.add(newDocument.id, newDocument);

        await this.onAfterAdd(newDocument);
        return newDocument;
    }

    async addBatch(
        documents: Omit<T, "id" | "createTime" | "updateTime" | "version">[],
    ): Promise<T[]> {
        const now = Date.now();
        const newDocuments: T[] = [];

        for (const doc of documents) {
            await this.onBeforeAdd(doc);

            const newDocument: T = {
                ...doc,
                id: crypto.randomUUID(),
                createTime: now,
                updateTime: now,
                version: 1,
            } as T;

            this.index.add(newDocument.id, newDocument as SearchableDocument);
            newDocuments.push(newDocument);

            await this.onAfterAdd(newDocument);
        }

        return newDocuments;
    }

    async update(
        id: string,
        updates: Partial<Omit<T, "id" | "createTime">>,
    ): Promise<T> {
        await this.onBeforeUpdate(id, updates);

        const existing = await this.getById(id);
        if (!existing) {
            throw new Error(`Document with id ${id} not found`);
        }

        const updatedDocument: T = {
            ...existing,
            ...updates,
            id, // 确保 id 不被覆盖
            updateTime: Date.now(),
            version: (existing.version || 1) + 1,
        };

        this.index.remove(id);
        this.index.add(id, updatedDocument as SearchableDocument);

        await this.onAfterUpdate(updatedDocument);
        return updatedDocument;
    }

    async remove(id: string): Promise<boolean> {
        await this.onBeforeRemove(id);

        const existing = await this.getById(id);
        if (!existing) {
            return false;
        }

        this.index.remove(id);
        await this.onAfterRemove(id);
        return true;
    }

    async getById(id: string): Promise<T | null> {
        // 通过导出所有文档查找指定 ID 的文档
        let foundDoc: T | null = null;

        this.index.export((docId, doc) => {
            if (docId === id && doc) {
                foundDoc = doc as unknown as T;
            }
        });

        return foundDoc;
    }

    async clear(): Promise<void> {
        // 危险操作，暂不实现
    }

    async updateBatch(
        updates: Array<{
            id: string;
            data: Partial<Omit<T, "id" | "createTime">>;
        }>,
    ): Promise<T[]> {
        const results: T[] = [];
        for (const { id, data } of updates) {
            const updated = await this.update(id, data);
            results.push(updated);
        }
        return results;
    }

    async removeBatch(ids: string[]): Promise<boolean[]> {
        const results: boolean[] = [];
        for (const id of ids) {
            const success = await this.remove(id);
            results.push(success);
        }
        return results;
    }

    close(): void {}

    // 全文搜索功能
    async search(options: SearchOptions): Promise<T[]> {
        return this.index
            .searchAsync({
                ...options,
                enrich: true,
            })
            .then((results) => {
                return results.flatMap(
                    (result) => (result.result as unknown as T[]) || [],
                );
            });
    }
}
