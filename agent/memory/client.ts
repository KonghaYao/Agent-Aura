import { LangChainEmbedder, MemoryDataBase } from "@langgraph-js/memory";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pool } from "pg";
import { PostgresVectorStore } from "@langgraph-js/memory/vector-store/pg";

// 初始化真实的服务
const llm = new ChatOpenAI({
    modelName: "qwen-flash",
    temperature: 0,
    streaming: false,
    maxRetries: 0,
});

const embedder = new LangChainEmbedder(
    new OpenAIEmbeddings({
        model: "text-embedding-3-small",
        dimensions: 1536,
        maxRetries: 1,
    }),
);
// 使用测试数据库配置
const pool = new Pool({
    connectionString: import.meta.env.MEMROY_DATABASE_URL,
});

const vectorStore = new PostgresVectorStore({
    pool,
    tableName: "langgraph_memory",
    dimension: 1536,
});

export const memoryDB = new MemoryDataBase(
    "agent-aura",
    llm,
    embedder,
    vectorStore,
);
if (import.meta.env.MEMORY_DATABASE_SETUP) {
    // 初始化表
    await memoryDB.setup();
    console.log("memoryDB setup");
}
