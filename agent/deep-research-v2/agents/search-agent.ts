import { ask_subagents } from "@/agent/tools/ask_subagent";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, tool, ToolMessage, ToolRuntime } from "langchain";
import { stateSchema, webSearchResult } from "../state";
import { tavily_search } from "../../tools/tavily";
import { change_research_topic, think_tool } from "../tools";
import { getToolCallId } from "@langgraph-js/pro";
import z from "zod";
import { Command } from "@langchain/langgraph";

export const end_of_search = tool(
    (args, config: ToolRuntime<typeof stateSchema, any>) => {
        const state = config.state;
        return new Command({
            update: {
                search_results: [
                    ...(state.search_results || []),
                    args.search_result_of_current_topic,
                ],
                messages: [
                    ...state.messages,
                    new ToolMessage({
                        name: "end_of_search",
                        tool_call_id: getToolCallId(config),
                        content: args.summary,
                    }),
                ],
            },
        });
    },
    {
        name: "end_of_search",
        description: "you don't need to provide compressed_content value",
        returnDirect: true,
        schema: z.object({
            summary: z.string().describe("the summary of the search"),
            search_result_of_current_topic: webSearchResult.describe(
                "the web search result,",
            ),
        }),
    },
);
export const searchSubAgent = ask_subagents(
    async (taskId, args, parent_state) => {
        return createAgent({
            name: `subagent_${taskId}`,
            model: new ChatOpenAI({
                modelName: parent_state.model_name || "gpt-4o-mini",
                streaming: true,
                streamUsage: true,
                metadata: {
                    parent_id: taskId,
                },
            }),
            stateSchema,
            tools: [
                tavily_search,
                think_tool,
                change_research_topic,
                end_of_search,
            ],
            systemPrompt: `You are a specialized Research Collector. Your ONLY role is to search for, filter, and collect high-quality web resources. You are NOT responsible for summarizing, analyzing, or answering the user's question directly.

<Task>
1. **Search**: Use \`tavily_search\` to find relevant information.
2. **Filter**: Critically evaluate search results. discard irrelevant, low-quality, or sponsored links.
3. **Collect**: Gather the URLs of the most useful and authoritative pages.
4. **Submit**: Use \`end_of_search\` to return the collected "useful_webpages" and the "topic".
</Task>

<Available Tools>
1. **tavily_search**: Search the web.
2. **think_tool**: Reflect on search progress (e.g., "Found 2 good sources, need 1 more on specific aspect").
3. **change_research_topic**: Use ONLY if the user explicitly changes the topic or if the current direction is dead.
4. **end_of_search**: THE ONLY WAY to finish. You MUST call this with your collected results.
</Available Tools>

<Instructions>
- **Objective**: Find 3-5 high-quality, distinct sources that cover the topic well.
- **No Chatting**: Do NOT provide a text summary or answer to the user. Do NOT say "I have found the information". Just call \`end_of_search\`.
- **Filter Aggressively**: Quality over quantity. 3 excellent sources are better than 10 mediocre ones.
- **Iterate**: If the first search is poor, refine your query and search again.
- **Stop Condition**: Once you have enough sources, call \`end_of_search\` immediately.
</Instructions>

<Hard Limits>
- Max 5 search calls.
- Stop if you have 3+ high-quality sources.
</Hard Limits>

<Show Your Thinking>
Use \`think_tool\` to track:
- "Current status: 2 good sources found."
- "Gap: Missing info on [specific aspect]."
- "Next step: Search for [specific query]."
</Show Your Thinking>
`,
        });
    },
    {
        name: "ask_search_subagent",
        description:
            "Ask the search subagent to execute web searches and gather information based on a topic or plan.",
        pass_through_keys: ["search_results"],
    },
);

export const promptForSearch = `
<Search Mode>
Once you have a clear research plan or a specific research question, delegate the actual searching to the search specialist by calling the \`ask_search_subagent\` tool.

**When to use:**
- You have a clear research topic or plan.
- You need to gather information from the web.

**How to use:**
Call \`ask_search_subagent\` with:
- \`subagent_id\`: "search_agent"
- \`question\`: The research topic or specific question to investigate.

The subagent will execute the search loop (Search -> Think -> Search...) and return the findings.
</Search Mode>
`;
