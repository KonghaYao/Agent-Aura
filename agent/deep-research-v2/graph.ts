import { Command, entrypoint } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { AgentState } from "@langgraph-js/pro";
import { createEntrypointGraph } from "@langgraph-js/pure-graph";
import { createAgent, HumanMessage, tool, ToolRuntime } from "langchain";
import { z } from "zod";
import { tavily_extract, tavily_search } from "../tools/tavily";
import {
    AIMessage,
    RemoveMessage,
    SystemMessage,
} from "@langchain/core/messages";
import PQueue from "p-queue";

const webSearchResult = z.object({
    topic: z.string().describe("the topic of the research"),
    useful_webpages: z
        .array(z.string())
        .describe("the useful webpages for the research"),
    compressed_content: z
        .string()
        .optional()
        .describe("the compressed content from all webpages"),
});

const stateSchema = AgentState.merge(
    z.object({
        topics: z.array(z.string()).default([]),
        search_results: z.array(webSearchResult).default([]),
        report: z.string().default(""),
    }),
);

const think_tool = tool(
    (args) => {
        return `Reflection recorded: ${args.reflection}`;
    },
    {
        name: "think_tool",
        description:
            "Strategic reflection tool for research planning. Use this tool after each search to analyze results and plan next steps systematically. This creates a deliberate pause in the research workflow for quality decision-making.",
        schema: z.object({
            reflection: z
                .string()
                .describe(
                    "Your detailed reflection on research progress, findings, gaps, and next steps",
                ),
        }),
    },
);
const change_research_topic = tool(
    (args, config: ToolRuntime<typeof stateSchema, any>) => {
        const state = config.state;
        const human_message_index = state.messages.findIndex((i) =>
            HumanMessage.isInstance(i),
        );
        const new_messages =
            human_message_index === -1
                ? state.messages
                : state.messages.slice(human_message_index + 1).map((i) => {
                      return new RemoveMessage({ id: i.id! });
                  });
        return new Command({
            update: {
                search_results: [
                    ...state.search_results,
                    args.search_result_of_current_topic,
                ],
                messages: [
                    ...new_messages,
                    // TODO 这里不知道会不会删去之前的 AI message 导致 tool_call 没有生效
                    // human_message_index === -1
                    new AIMessage({
                        content:
                            "ok, I done change search topic to " +
                            args.new_topic +
                            ", now I will start to search for the new topic, reason: " +
                            args.reason_for_changing_topic,
                        //   tool_call_id: config.toolCall!.id!,
                    }),
                    // : new HumanMessage({ content: args.topic }),
                ].filter((i) => i),
            },
        });
    },
    {
        name: "change_research_topic",
        description:
            "call this tool, when you want to change the research topic",
        schema: z.object({
            reason_for_changing_topic: z
                .string()
                .describe("the reason for changing the topic"),
            new_topic: z.string().describe("the new topic of the research"),
            search_result_of_current_topic: webSearchResult.describe(
                "the web search result",
            ),
        }),
        returnDirect: true,
    },
);
const end_of_research = tool(
    () => {
        return "end of research";
    },
    {
        name: "end_of_research",
        returnDirect: true,
    },
);

const research_agent = createAgent({
    model: new ChatOpenAI({
        modelName: "gpt-4o-mini",
        streaming: true,
        streamUsage: true,
    }),
    tools: [tavily_search, think_tool, change_research_topic, end_of_research],
    systemPrompt: `You are a research assistant conducting research on the user's input topic. For context, today's date is ${
        new Date().toISOString().split("T")[0]
    }.

<Task>
Your job is to use tools to gather information about the user's input topic.
You can use any of the tools provided to you to find resources that can help answer the research question. You can call these tools in series or in parallel, your research is conducted in a tool-calling loop.
</Task>

<Available Tools>
You have access to three main tools:
1. **tavily_extract**: For extracting content from web pages
2. **think_tool**: For reflection and strategic planning during research
3. **change_research_topic**: For changing the research topic when needed

**CRITICAL: Use think_tool after each search to reflect on results and plan next steps. Do not call think_tool with the tavily_extract or any other tools. It should be to reflect on the results of the search.**
</Available Tools>

<Instructions>
Think like a human researcher with limited time. Follow these steps:

1. **Read the question carefully** - What specific information does the user need?
2. **Start with broader searches** - Use broad, comprehensive queries first
3. **After each search, pause and assess** - Do I have enough to answer? What's still missing?
4. **Execute narrower searches as you gather information** - Fill in the gaps
5. **Stop when you can answer confidently** - Don't keep searching for perfection
</Instructions>

<Hard Limits>
**Tool Call Budgets** (Prevent excessive searching):
- **Simple queries**: Use 2-3 search tool calls maximum
- **Complex queries**: Use up to 5 search tool calls maximum
- **Always stop**: After 5 search tool calls if you cannot find the right sources

**Stop Immediately When**:
- You can answer the user's question comprehensively
- You have 3+ relevant examples/sources for the question
- Your last 2 searches returned similar information
</Hard Limits>

<Show Your Thinking>
After each search tool call, use think_tool to analyze the results:
- What key information did I find?
- What's missing?
- Do I have enough to answer the question comprehensively?
- Should I search more or provide my answer?
</Show Your Thinking>`,
    stateSchema,
});

const getPage = async (page_url: string) => {
    const response = await tavily_extract.invoke({ urls: [page_url] });
    return response.results[0]?.raw_content || "";
};

const generateFinalReport = async (
    searchResults: z.infer<typeof webSearchResult>[],
) => {
    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });

    const prompt = `You are tasked with summarizing the raw content of a webpage retrieved from a web search. Your goal is to create a summary that preserves the most important information from the original web page. This summary will be used by a downstream research agent, so it's crucial to maintain the key details without losing essential information.

Please follow these guidelines to create your summary:

1. Identify and preserve the main topic or purpose of the webpage.
2. Retain key facts, statistics, and data points that are central to the content's message.
3. Keep important quotes from credible sources or experts.
4. Maintain the chronological order of events if the content is time-sensitive or historical.
5. Preserve any lists or step-by-step instructions if present.
6. Include relevant dates, names, and locations that are crucial to understanding the content.
7. Summarize lengthy explanations while keeping the core message intact.

When handling different types of content:

- For news articles: Focus on the who, what, when, where, why, and how.
- For scientific content: Preserve methodology, results, and conclusions.
- For opinion pieces: Maintain the main arguments and supporting points.
- For product pages: Keep key features, specifications, and unique selling points.

Your summary should be significantly shorter than the original content but comprehensive enough to stand alone as a source of information. Aim for about 25-30 percent of the original length, unless the content is already concise.

Present your summary in plain text format with the following structure:

**Summary**
[Your comprehensive summary here, structured with appropriate paragraphs or bullet points as needed]

**Key Excerpts**
- First important quote or excerpt
- Second important quote or excerpt
- Third important quote or excerpt
[... Add more excerpts as needed, up to a maximum of 5]

Here are two examples of good summaries:

Example 1 (for a news article):

**Summary**
On July 15, 2023, NASA successfully launched the Artemis II mission from Kennedy Space Center. This marks the first crewed mission to the Moon since Apollo 17 in 1972. The four-person crew, led by Commander Jane Smith, will orbit the Moon for 10 days before returning to Earth. This mission is a crucial step in NASA's plans to establish a permanent human presence on the Moon by 2030.

**Key Excerpts**
- "Artemis II represents a new era in space exploration," said NASA Administrator John Doe.
- "The mission will test critical systems for future long-duration stays on the Moon," explained Lead Engineer Sarah Johnson.
- "We're not just going back to the Moon, we're going forward to the Moon," Commander Jane Smith stated during the pre-launch press conference.

Example 2 (for a scientific article):

**Summary**
A new study published in Nature Climate Change reveals that global sea levels are rising faster than previously thought. Researchers analyzed satellite data from 1993 to 2022 and found that the rate of sea-level rise has accelerated by 0.08 mm/year² over the past three decades. This acceleration is primarily attributed to melting ice sheets in Greenland and Antarctica. The study projects that if current trends continue, global sea levels could rise by up to 2 meters by 2100, posing significant risks to coastal communities worldwide.

**Key Excerpts**
- "Our findings indicate a clear acceleration in sea-level rise, which has significant implications for coastal planning and adaptation strategies," lead author Dr. Emily Brown stated.
- "The rate of ice sheet melt in Greenland and Antarctica has tripled since the 1990s," the study reports.
- "Without immediate and substantial reductions in greenhouse gas emissions, we are looking at potentially catastrophic sea-level rise by the end of this century," warned co-author Professor Michael Green.

Remember, your goal is to create a summary that can be easily understood and utilized by a downstream research agent while preserving the most critical information from the original webpage.

Today's date is ${new Date().toISOString().split("T")[0]}.`;

    const response = await model.invoke([
        new SystemMessage({
            content: prompt,
        }),
        new HumanMessage({
            content: `Please generate a comprehensive final report based on the following compressed research findings:

<research_results>
${searchResults
    .map(
        (result) => `  <topic>
    <title>${result.topic}</title>
    <compressed_content>
${result.compressed_content || "No compressed content available"}
    </compressed_content>
  </topic>`,
    )
    .join("\n")}
</research_results>

Original Research Query: ${searchResults[0]?.topic || "General research"}
Date: ${new Date().toISOString().split("T")[0]}`,
        }),
    ]);

    return response.text;
};

const compressTopicDetails = async (topic: string, webpages: string[]) => {
    const model = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });

    const prompt = `You are a research assistant that has conducted research on a topic by calling several tools and web searches. Your job is now to clean up the findings, but preserve all of the relevant statements and information that the researcher has gathered. 

<Task>
You need to clean up information gathered from tool calls and web searches in the existing messages.
All relevant information should be repeated and rewritten verbatim, but in a cleaner format.
The purpose of this step is just to remove any obviously irrelevant or duplicative information.
For example, if three sources all say "X", you could say "These three sources all stated X".
Only these fully comprehensive cleaned findings are going to be returned to the user, so it's crucial that you don't lose any information from the raw messages.
</Task>

<Guidelines>
1. Your output findings should be fully comprehensive and include ALL of the information and sources that the researcher has gathered from tool calls and web searches. It is expected that you repeat key information verbatim.
2. This report can be as long as necessary to return ALL of the information that the researcher has gathered.
3. In your report, you should return inline citations for each source that the researcher found.
4. You should include a "Sources" section at the end of the report that lists all of the sources the researcher found with corresponding citations, cited against statements in the report.
5. Make sure to include ALL of the sources that the researcher gathered in the report, and how they were used to answer the question!
6. It's really important not to lose any sources. A later LLM will be used to merge this report with others, so having all of the sources is critical.
</Guidelines>

<Output Format>
The report should be structured like this:
**List of Queries and Tool Calls Made**
**Fully Comprehensive Findings**
**List of All Relevant Sources (with citations in the report)**
</Output Format>

<Citation Rules>
- Assign each unique URL a single citation number in your text
- End with ### Sources that lists each source with corresponding numbers
- IMPORTANT: Number sources sequentially without gaps (1,2,3,4...) in the final list regardless of which sources you choose
- Example format:
  [1] Source Title: URL
  [2] Source Title: URL
</Citation Rules>

Critical Reminder: It is extremely important that any information that is even remotely relevant to the user's research topic is preserved verbatim (e.g. don't rewrite it, don't summarize it, don't paraphrase it).
`;

    const response = await model.invoke([
        new SystemMessage({
            content: prompt,
        }),

        new HumanMessage({
            content: `Research Topic: ${topic}

I have conducted research on this topic using various tools and web searches. Below are the raw findings I gathered from different webpages. Each webpage content is provided as a separate message in this conversation.

My task now is to clean up and organize all this information according to the guidelines provided, preserving all relevant information while removing duplicates and irrelevant content.

Date of research: ${new Date().toISOString().split("T")[0]}.

The following messages contain the webpage content I extracted during my research process.`,
        }),
        ...webpages.map((page) => {
            return new HumanMessage({
                content: page,
            });
        }),
    ]);

    // 确保返回字符串
    return response.text;
};

export const graph = createEntrypointGraph({
    stateSchema,
    graph: entrypoint<z.infer<typeof stateSchema>, any>(
        { name: "deep-research-v2" },
        async (state: z.infer<typeof stateSchema>, context?: any) => {
            // Scope

            // Research
            const search_result_state = await research_agent.invoke(state);

            // get Details
            const newQueue = new PQueue({ concurrency: 3 });
            await newQueue.addAll(
                search_result_state.search_results.flatMap((web, index) => {
                    return web.useful_webpages.map((page_url, sub_index) => {
                        // task to get all page detail
                        return async () => {
                            const result = await getPage(page_url);
                            search_result_state.search_results[
                                index
                            ].useful_webpages[sub_index] =
                                `From ${page_url}\n\n---\n\n` + result;
                        };
                    });
                }),
            );
            await newQueue.onIdle();

            // Compress topic detail
            const compressQueue = new PQueue({ concurrency: 3 });
            const compressTasks = search_result_state.search_results.map(
                (result, index) => {
                    return async () => {
                        try {
                            const compressedContent =
                                await compressTopicDetails(
                                    result.topic,
                                    result.useful_webpages,
                                );
                            // 将压缩后的内容存储回 search_results
                            search_result_state.search_results[
                                index
                            ].compressed_content = compressedContent;
                        } catch (error) {
                            console.error(
                                `Failed to compress topic "${result.topic}":`,
                                error,
                            );
                            // 设置默认错误内容，确保流程继续
                            search_result_state.search_results[
                                index
                            ].compressed_content = `Error: Failed to compress topic "${
                                result.topic
                            }". Error: ${
                                error instanceof Error
                                    ? error.message
                                    : String(error)
                            }`;
                        }
                    };
                },
            );

            // 添加所有任务到队列
            const taskPromises = compressTasks.map((task) =>
                compressQueue.add(task),
            );

            try {
                // 等待所有任务完成或失败
                await Promise.allSettled(taskPromises);
                // 等待队列完全空闲
                await compressQueue.onIdle();
            } catch (error) {
                console.error("Compress queue execution failed:", error);
                // 继续执行，不中断整个流程
            }

            // Generate report
            const finalReport = await generateFinalReport(
                search_result_state.search_results,
            );
            search_result_state.report = finalReport;

            return search_result_state;
        },
    ),
});
