import { Meilisearch } from "meilisearch";
import { getEnv } from "../getEnv";

/**
 * 文件存储的数据结构
 */
interface FileStoreSchema {
    id: string; //
    user_id: string; // 过滤条件
    content: string;
    filename?: string; // 可选的文件名
    created_at: string; // 过滤条件
    updated_at: string; // 过滤条件
}

/**
 * 基于 Meilisearch 的文本存储服务
 * 提供基本的文档存储、搜索和过滤功能
 */
export class TextStoreService {
    /** Meilisearch 客户端实例 */
    private db!: Meilisearch;

    /** 索引名称 */
    private indexName = "file-store";

    /** 是否已初始化 */
    private initialized = false;

    /**
     * 构造函数，初始化 Meilisearch 客户端
     */
    constructor() {
        this.db = new Meilisearch({
            host: getEnv("MEILISEARCH_HOST"),
            apiKey: getEnv("MEILISEARCH_API_KEY"),
        });
    }

    /**
     * 初始化服务，创建索引并配置过滤和排序字段
     * @param force 是否强制重新初始化，默认 false
     */
    async setup(force = false) {
        if (this.initialized && !force) {
            return;
        }

        await this.createIndex(this.indexName);
        // 设置可过滤字段
        await this.db
            .index(this.indexName)
            .updateFilterableAttributes([
                "user_id",
                "created_at",
                "updated_at",
            ]);
        // 设置可排序字段
        await this.db
            .index(this.indexName)
            .updateSortableAttributes(["created_at", "updated_at"]);

        this.initialized = true;
    }

    /**
     * 创建索引
     * @param indexName 索引名称
     */
    async createIndex(indexName: string) {
        return await this.db.createIndex(indexName);
    }

    /**
     * 保存文档到文件存储
     * @param file 要保存的文件数据
     */
    async saveToFileStore(file: FileStoreSchema) {
        return await this.db
            .index(this.indexName)
            .addDocuments([file], { primaryKey: "id" });
    }

    /**
     * 更新文档
     * @param id 文档ID
     * @param updates 要更新的字段
     */
    async updateFileStore(id: string, updates: Partial<FileStoreSchema>) {
        return await this.db.index(this.indexName).updateDocuments([
            {
                id,
                ...updates,
                updated_at: new Date().toISOString(),
            },
        ]);
    }

    /**
     * 删除文档
     * @param id 文档ID
     */
    async deleteFileStore(id: string) {
        return await this.db.index(this.indexName).deleteDocument(id);
    }

    /**
     * 根据ID获取文档
     * @param id 文档ID
     */
    async getFileStore(id: string) {
        const result = await this.db.index(this.indexName).getDocument(id);
        return result;
    }

    /**
     * 搜索文档，支持全文搜索和各种过滤条件
     * @param query 搜索关键词
     * @param options 搜索选项
     * @param options.userId 用户ID过滤
     * @param options.limit 返回结果数量限制，默认20
     * @param options.offset 分页偏移量，默认0
     * @param options.sort 排序字段数组
     * @param options.filter 额外的过滤条件
     */
    async searchFileStore(
        query: string,
        options?: {
            userId?: string;
            limit?: number;
            offset?: number;
            sort?: string[];
            filter?: string;
        },
    ) {
        const searchOptions: any = {
            limit: options?.limit || 20,
            offset: options?.offset || 0,
        };

        if (options?.userId) {
            searchOptions.filter = `user_id = "${options.userId}"`;
        }

        if (options?.filter) {
            searchOptions.filter = searchOptions.filter
                ? `${searchOptions.filter} AND ${options.filter}`
                : options.filter;
        }

        if (options?.sort) {
            searchOptions.sort = options.sort;
        }

        return await this.db.index(this.indexName).search(query, searchOptions);
    }

    /**
     * 获取指定用户的所有文件
     * @param userId 用户ID
     * @param options 查询选项
     * @param options.limit 返回结果数量限制，默认50
     * @param options.offset 分页偏移量，默认0
     * @param options.sort 排序字段数组，默认按创建时间倒序
     */
    async getUserFiles(
        userId: string,
        options?: {
            limit?: number;
            offset?: number;
            sort?: string[];
        },
    ) {
        return await this.db.index(this.indexName).search("", {
            filter: `user_id = "${userId}"`,
            limit: options?.limit || 50,
            offset: options?.offset || 0,
            sort: options?.sort || ["created_at:desc"],
        });
    }
}
