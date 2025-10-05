import { Annotation } from "@langchain/langgraph";
import {
    createArrayAnnotation,
    createDefaultAnnotation,
    createModelHelper,
    createState,
} from "@langgraph-js/pro";
import { models } from "../models.js";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";

export const { ModelState, createLLM } = createModelHelper(models);

// Query 接口
export interface Query {
    query: string;
    rationale: string;
}

// 反思状态
export const ReflectionState = createState().build({
    is_sufficient: createDefaultAnnotation<boolean>(() => false),
    knowledge_gap: createDefaultAnnotation<string>(() => ""),
    follow_up_queries: createArrayAnnotation<string>(),
    research_loop_count: createDefaultAnnotation(() => 0),
    number_of_ran_queries: createDefaultAnnotation(() => 0),
    max_research_loops: createDefaultAnnotation(() => 3),
});

export const OverallState = createState(
    ModelState,
    createReactAgentAnnotation(),
    ReflectionState,
).build({
    lang: createDefaultAnnotation<string>(() => "en-US"),
    research_topic: createDefaultAnnotation<string>(() => ""),
    search_query: createArrayAnnotation<Query>(),
    web_research_result: createArrayAnnotation<string>(),
    sources_gathered: createArrayAnnotation<{
        short_url: string;
        value: string;
    }>(),
    initial_search_query_count: createDefaultAnnotation<number>(() => 3),
    max_research_loops: createDefaultAnnotation<number>(() => 3),
    research_loop_count: createDefaultAnnotation<number>(() => 0),
    reasoning_model: createDefaultAnnotation<string>(() => ""),
});

// 查询生成状态
export const QueryGenerationState = createState().build({
    search_query: createArrayAnnotation<Query>(),
});

// Web搜索状态
export const WebSearchState = createState(
    createReactAgentAnnotation(),
    ModelState,
).build({
    search_query: Annotation<Query>(),
    id: createDefaultAnnotation<string>(() => ""),
});

// 搜索状态输出类
export interface SearchStateOutput {
    running_summary?: string; // Final report
}

// 导出类型
export type OverallState = typeof OverallState.State;
export type ReflectionState = typeof ReflectionState.State;
export type QueryGenerationState = typeof QueryGenerationState.State;
export type WebSearchState = typeof WebSearchState.State;
