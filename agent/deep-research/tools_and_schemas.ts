import { z } from "zod";

// Query 模式
export const QuerySchema = z.object({
    query: z.string().describe("搜索查询"),
    rationale: z.string().describe("查询的理由说明"),
});

// 搜索查询列表的模式
export const SearchQueryListSchema = z.object({
    search_query: z.array(QuerySchema).describe("生成的搜索查询列表"),
});

export type Query = z.infer<typeof QuerySchema>;
export type SearchQueryList = z.infer<typeof SearchQueryListSchema>;

// 反思的模式
export const ReflectionSchema = z.object({
    is_sufficient: z.boolean().describe("当前研究是否足够"),
    knowledge_gap: z.string().describe("识别的知识缺口"),
    follow_up_queries: z.array(z.string()).describe("后续查询列表"),
});

export type Reflection = z.infer<typeof ReflectionSchema>;
