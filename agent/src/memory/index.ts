import { Milvus } from "@langchain/community/vectorstores/milvus";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";

// 定义搜索结果项接口
export interface SearchResultItem {
    userId: string;
    key: string;
    text: string;
    score: number;
    id: string;
}

export interface BaseDataStore {
    initialize(): Promise<BaseDataStore>;
    get(userId: string, key: string): Promise<string | null>;
    search(
        userId: string,
        query: string,
        limit: number,
    ): Promise<SearchResultItem[]>;
    put(userId: string, key: string, value: string): Promise<void>;
    delete(userId: string, key: string): Promise<void>;
}
/**
 * 基于 Milvus 向量数据库的简化存储实现
 */
class MilvusStore implements BaseDataStore {
    private vectorStore: Milvus | null = null;
    private isInitialized: boolean = false;

    constructor(
        public embeddings = new OpenAIEmbeddings({
            model: "text-embedding-v4", //qwen3 text-embedding-v4
            dimensions: 1024,
        }),
        public collectionName = "agent_memory",
    ) {}
    private baseConfig = {
        primaryField: "id",
        textField: "text",
        textFieldMaxLength: 1024,
    };
    async initialize() {
        if (this.isInitialized) {
            return this;
        }
        try {
            const connectionUri = new URL(process.env.MILVUS_URL || "");
            const username = connectionUri.username;
            const password = connectionUri.password;
            connectionUri.username = "";
            connectionUri.password = "";
            connectionUri.pathname = "";
            const url = connectionUri.toString().slice(0, -1);
            // 尝试连接到现有集合
            try {
                this.vectorStore = await Milvus.fromExistingCollection(
                    this.embeddings,
                    {
                        collectionName: this.collectionName,
                        url: url,
                        ssl: true,
                        username: username,
                        password: password,
                        ...this.baseConfig,
                    },
                );
                console.log("已连接到现有 Milvus 集合");
            } catch (error) {
                // 如果集合不存在，创建一个新的集合
                console.log("创建新的 Milvus 集合");
                this.vectorStore = new Milvus(this.embeddings, {
                    collectionName: this.collectionName,
                    url: url,
                    ssl: true,
                    username: username,
                    password: password,
                    ...this.baseConfig,
                });

                await this.vectorStore.createCollection(
                    [new Array(1024).fill(0)],
                    [
                        new Document({
                            pageContent: "test",
                            metadata: {
                                userId: "0".repeat(64),
                                key: "0".repeat(64),
                                type: "memory",
                            },
                        }),
                    ],
                );
                await this.vectorStore.client.createIndex({
                    collection_name: this.collectionName,
                    index_name: "key",
                    index_type: "FLAT",
                    field_name: "key",
                });
                await this.vectorStore.client.createIndex({
                    collection_name: this.collectionName,
                    index_name: "userId",
                    index_type: "FLAT",
                    field_name: "userId",
                });
            }
            this.isInitialized = true;
        } catch (error) {
            console.error("初始化 Milvus 存储失败:", error);
            throw error;
        }

        return this;
    }

    async clear() {
        if (!this.isInitialized || !this.vectorStore) {
            console.warn("Milvus 客户端未初始化，无法清空数据");
            return;
        }

        try {
            // 删除并重新创建集合以清空数据
            await this.vectorStore.delete({});
            console.log("已清空 Milvus 存储");
        } catch (error) {
            console.error("清空 Milvus 存储失败:", error);
        }
    }
    private async getSingleResult(
        userId: string,
        key: string,
    ): Promise<SearchResultItem | null> {
        const results = await this.vectorStore?.client.query({
            collection_name: this.collectionName,
            filter: `userId == "${userId}" AND key == "${key}"`,
            limit: 1,
            output_fields: ["id", "userId", "key", "text"],
        });
        return results?.data[0] as SearchResultItem | null;
    }

    async get(userId: string, key: string): Promise<string | null> {
        if (!this.vectorStore) {
            throw new Error("Milvus 客户端未初始化");
        }

        const result = await this.getSingleResult(userId, key);
        return result?.text || null;
    }

    async search(
        userId: string,
        query: string = "",
        limit: number = 5,
    ): Promise<SearchResultItem[]> {
        if (!this.vectorStore) {
            throw new Error("Milvus 客户端未初始化");
        }
        if (!query) {
            const results = await this.vectorStore.client.query({
                collection_name: this.collectionName,
                filter: `userId == "${userId}"`,
                limit: limit,
                output_fields: ["id", "userId", "key", "text"],
            });
            return (
                results?.data.map((item) => ({
                    id: item.id,
                    userId: item.userId,
                    key: item.key,
                    text: item.text,
                    score: 1,
                })) || []
            );
        }
        const results = await this.vectorStore.similaritySearchWithScore(
            query,
            limit,
            `userId == "${userId}"`,
        );

        return results.map(([doc, score]) => {
            const metadata = doc.metadata || {};
            return {
                id: doc.id,
                userId: metadata.userId || "",
                key: metadata.key || "",
                text: doc.pageContent,
                score: score || 0,
            } as SearchResultItem;
        });
    }

    async put(userId: string, key: string, value: string): Promise<void> {
        if (!this.vectorStore) {
            throw new Error("Milvus 客户端未初始化");
        }

        const oldValue = await this.getSingleResult(userId, key);
        // console.log(oldValue?.id);
        console.log(userId);
        const metadata = {
            userId: userId,
            key: key,
            type: "memory",
        };

        await this.vectorStore.addDocuments([
            new Document({
                pageContent: value,
                metadata: metadata,
            }),
        ]);
        if (oldValue) {
            await this.vectorStore.client.delete({
                collection_name: this.collectionName,
                ids: [oldValue.id],
            });
        }
    }

    async delete(userId: string, key: string): Promise<void> {
        if (!this.vectorStore) {
            throw new Error("Milvus 客户端未初始化");
        }
        await this.vectorStore.delete({
            filter: `userId == "${userId}" AND key == "${key}"`,
        });
    }
}

export const store = new MilvusStore();
