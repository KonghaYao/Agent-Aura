import { z } from "zod";
import { SubAgentStateSchema } from "../tools/ask_subagent";
import { AgentState } from "@langgraph-js/pro";

export const webSearchResult = z.object({
    topic: z.string().describe("the topic of the research"),
    useful_webpages: z
        .array(z.string())
        .describe("the useful webpages for the research"),
});

export const deepSearchResult = webSearchResult.extend({
    compressed_content: z
        .string()
        .optional()
        .describe("the compressed content from all webpages"),
});

export const stateSchema = AgentState.extend({
    model_name: z.string().optional().default("gpt-4o-mini"),
    topics: z.array(z.string()).default([]).describe("搜索过程中的主题"),
    search_results: z
        .array(deepSearchResult)
        .default([])
        .describe("agent 搜索到的信息"),
    lang: z.string().default("zh-CN").describe("语言"),
}).merge(SubAgentStateSchema);
