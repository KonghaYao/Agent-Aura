import {
    StateGraph,
    START,
    END,
    Send,
    Command,
    getCurrentTaskInput,
} from "@langchain/langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import {
    OverallState,
    createLLM,
    ReflectionState,
    WebSearchState,
} from "./state";
import { ReflectionSchema, QuerySchema } from "./tools_and_schemas";
import { ConfigurationHelper } from "./configuration";
// 移除 prompts 导入，直接在文件中定义模板字符串
import { getResearchTopic } from "./utils";
import { z } from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { TavilySearch, TavilyCrawl } from "@langchain/tavily";

const tavilySearchTool = new TavilySearch({
    maxResults: 5,
});
const tavilyCrawlTool = new TavilyCrawl({});

// 工具函数
function getCurrentDate(): string {
    return new Date().toISOString().split("T")[0] || "";
}

const reflectionInstructions = (params: {
    current_date: string;
    research_topic: string;
    summaries: string;
}) => `You are an expert research assistant analyzing summaries about "${params.research_topic}".

Instructions:
- Identify knowledge gaps or areas that need deeper exploration and generate a follow-up query. (1 or multiple).
- If provided summaries are sufficient to answer the user's question, don't generate a follow-up query.
- If there is a knowledge gap, generate a follow-up query that would help expand your understanding.
- Focus on technical details, implementation specifics, or emerging trends that weren't fully covered.

Requirements:
- Ensure the follow-up query is self-contained and includes necessary context for web search.

Output Format:
- Format your response as a JSON object with these exact keys:
   - "is_sufficient": true or false
   - "knowledge_gap": Describe what information is missing or needs clarification
   - "follow_up_queries": Write a specific question to address this gap

Example:
\`\`\`json
{
    "is_sufficient": true, // or false
    "knowledge_gap": "The summary lacks information about performance metrics and benchmarks", // "" if is_sufficient is true
    "follow_up_queries": ["What are typical performance benchmarks and metrics used to evaluate [specific technology]?"] // [] if is_sufficient is true
}
\`\`\`

Reflect carefully on the Summaries to identify knowledge gaps and produce a follow-up query. Then, produce your output.

Summaries:
${params.summaries}`;

const answerInstructions = (params: {
    current_date: string;
    research_topic: string;
    summaries: string;
}) => `Generate a high-quality answer to the user's question based on the provided summaries.

Instructions:
- The current date is ${params.current_date}.
- You are the final step of a multi-step research process, don't mention that you are the final step. 
- You have access to all the information gathered from the previous steps.
- You have access to the user's question.
- Generate a high-quality answer to the user's question based on the provided summaries and the user's question.
- Include the sources you used from the Summaries in the answer correctly, use markdown format (e.g. [apnews](https://vertexaisearch.cloud.google.com/id/1-0)). THIS IS A MUST.

User Context:
- ${params.research_topic}

Summaries:
${params.summaries}`;

/**
 * 生成搜索查询的节点
 */
async function generateQuery(state: OverallState, config: RunnableConfig) {
    const configurable = ConfigurationHelper.fromRunnableConfig(config);

    // 检查自定义初始搜索查询数量
    if (
        state.initial_search_query_count === null ||
        state.initial_search_query_count === undefined
    ) {
        state.initial_search_query_count =
            configurable.number_of_initial_queries;
    }

    // 初始化 LLM
    const llm = await createLLM(state, "main_model");

    const formattedPrompt = `Your goal is to generate sophisticated and diverse web search queries. These queries are intended for an advanced automated web research tool capable of analyzing complex results, following links, and synthesizing information.

Instructions:
- Always prefer a single search query, only add another query if the original question requests multiple aspects or elements and one query is not enough.
- Each query should focus on one specific aspect of the original question.
- Don't produce more than ${state.initial_search_query_count} queries.
- Queries should be diverse, if the topic is broad, generate more than 1 query.
- Don't generate multiple similar queries, 1 is enough.
- Query should ensure that the most current information is gathered. The current date is ${getCurrentDate()}.


User save_research_details tool to save the research details to the state.
Example:

\`\`\`json
{
    "research_topic": "What revenue grew more last year apple stock or the number of people buying an iphone",
    "queries": [{
        "rationale": "To answer this comparative growth question accurately, we need specific data points on Apple's stock performance and iPhone sales metrics. These queries target the precise financial information needed: company revenue trends, product-specific unit sales figures, and stock price movement over the same fiscal period for direct comparison.",
        "query": ["Apple total revenue growth fiscal year 2024", "iPhone unit sales growth fiscal year 2024", "Apple stock price growth fiscal year 2024"]
    }]
}
\`\`\`
`;
    let data = {};
    const setData = tool(
        (input) => {
            data = {
                search_query: input.queries,
                research_topic: input.research_topic,
            };
            return "saved";
        },
        {
            name: "save_research_details",
            description: "save research details to the state",
            schema: z.object({
                queries: z.array(QuerySchema),
                research_topic: z.string(),
            }),
            returnDirect: true,
        },
    );
    const agent = createReactAgent({
        llm,
        tools: [setData],
        prompt: formattedPrompt,
    });

    // 生成搜索查询
    const res = await agent.invoke(state);
    if (res.messages.find((m) => m.name === "save_research_details")) {
        return new Command({
            goto: "web_research",
            update: {
                messages: res.messages,
                /** @ts-ignore */
                search_query: data.search_query,
                /** @ts-ignore */
                research_topic: data.research_topic,
            },
        });
    }
    return new Command({
        goto: END,
        update: {
            messages: res.messages,
        },
    });
}

/**
 * 继续到网络研究的路由函数
 */
function continueToWebResearch(state: OverallState) {
    return state.search_query.map(
        (searchQuery, idx) =>
            new Send("web_research", {
                search_query: searchQuery,
                id: idx.toString(),
            }),
    );
}

/**
 * 网络研究节点
 */
async function webResearch(
    state: WebSearchState,
    config: RunnableConfig,
): Promise<Partial<OverallState>> {
    const configurable = ConfigurationHelper.fromRunnableConfig(config);
    const query = state.search_query.query;
    const formattedPrompt = `Conduct targeted Google Searches to gather the most recent, credible information on "${query}" and synthesize it into a verifiable text artifact.

Instructions:
- Query should ensure that the most current information is gathered. The current date is ${getCurrentDate()}.
- Conduct multiple, diverse searches to gather comprehensive information.
- Consolidate key findings while meticulously tracking the source(s) for each specific piece of information.
- The output should be a well-written summary or report based on your search findings. 
- Only include the information found in the search results, don't make up any information.

Research Topic:
${query}
`;

    // 使用 google genai 客户端
    const llm = await createLLM(
        {
            main_model: "gpt-4o",
        },
        "main_model",
        {
            temperature: 0,
        },
    );
    const result = {
        sources_gathered: [],
        search_query: [state.search_query],
        web_research_result: [] as string[],
    };
    const setData = tool(
        (input) => {
            result.web_research_result.push(input.text);
            return "saved web search result";
        },
        {
            name: "save_research_details",
            description: "save research details to the state",
            schema: z.object({
                text: z.string(),
            }),
            returnDirect: true,
        },
    );

    const agent = createReactAgent({
        llm,
        tools: [tavilyCrawlTool, tavilySearchTool, setData],
        prompt: formattedPrompt,
        stateSchema: WebSearchState,
    });
    const agentCall = await agent.invoke({
        ...state,
    });

    return {
        ...result,
        messages: agentCall.messages,
    };
}

/**
 * 反思节点
 */
async function reflection(
    state: OverallState,
    config: RunnableConfig,
): Promise<Partial<ReflectionState>> {
    const configurable = ConfigurationHelper.fromRunnableConfig(config);

    // 增加研究循环计数并获取推理模型
    const researchLoopCount = (state.research_loop_count || 0) + 1;
    const reasoningModel =
        state.reasoning_model || configurable.reflection_model;

    // 格式化提示
    const currentDate = getCurrentDate();
    const formattedPrompt = reflectionInstructions({
        current_date: currentDate,
        research_topic: getResearchTopic(state.messages),
        summaries: state.web_research_result.join("\n\n---\n\n"),
    });

    // 初始化推理模型
    const llm = await createLLM(state, "main_model");
    const result = await llm
        .withStructuredOutput(ReflectionSchema)
        .invoke(formattedPrompt);

    return {
        is_sufficient: result.is_sufficient,
        knowledge_gap: result.knowledge_gap,
        follow_up_queries: result.follow_up_queries,
        research_loop_count: researchLoopCount,
        number_of_ran_queries: state.search_query.length,
    };
}

/**
 * 评估研究的路由函数
 */
function evaluateResearch(
    state: OverallState,
    config: RunnableConfig,
): string | Send[] {
    const configurable = ConfigurationHelper.fromRunnableConfig(config);
    const maxResearchLoops =
        state.max_research_loops !== null &&
        state.max_research_loops !== undefined
            ? state.max_research_loops
            : configurable.max_research_loops;

    if (state.is_sufficient || state.research_loop_count >= maxResearchLoops) {
        return "finalize_answer";
    } else {
        return state.follow_up_queries.map(
            (followUpQuery, idx) =>
                new Send("web_research", {
                    messages: state.messages,
                    search_query: followUpQuery,
                    id: (state.number_of_ran_queries + idx).toString(),
                }),
        );
    }
}

/**
 * 最终化答案节点
 */
async function finalizeAnswer(
    state: OverallState,
    config: RunnableConfig,
): Promise<Partial<OverallState>> {
    const configurable = ConfigurationHelper.fromRunnableConfig(config);
    const reasoningModel = state.reasoning_model || configurable.answer_model;

    // 格式化提示
    const currentDate = getCurrentDate();
    const formattedPrompt = answerInstructions({
        current_date: currentDate,
        research_topic: getResearchTopic(state.messages),
        summaries: state.web_research_result.join("\n---\n\n"),
    });

    // 初始化推理模型
    const llm = await createLLM(state, "main_model");
    const result = await llm.invoke(formattedPrompt);

    // 用原始URL替换短URL，并将所有使用的URL添加到sources_gathered
    const uniqueSources = [];
    let content = result.content as string;

    for (const source of state.sources_gathered) {
        if (content.includes(source.short_url)) {
            content = content.replace(source.short_url, source.value);
            uniqueSources.push(source);
        }
    }

    return {
        messages: [new AIMessage({ content })],
        sources_gathered: uniqueSources,
    };
}

// 创建代理图
const builder = new StateGraph(OverallState)

    // 定义我们将在其间循环的节点
    .addNode("generate_query", generateQuery)
    .addNode("web_research", webResearch)
    .addNode("reflection", reflection)
    .addNode("finalize_answer", finalizeAnswer)

    // 设置入口点为 `generate_query`
    .addEdge(START, "generate_query")
    .addConditionalEdges("generate_query", continueToWebResearch, [
        "web_research",
    ])
    .addEdge("web_research", "reflection")
    .addConditionalEdges("reflection", evaluateResearch, [
        "web_research",
        "finalize_answer",
    ])
    .addEdge("finalize_answer", END);
export const graph = builder.compile();
