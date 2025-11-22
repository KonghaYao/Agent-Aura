import { tool, ToolRuntime, HumanMessage } from "langchain";
import { z } from "zod";
import { AgentState } from "@langgraph-js/pro";
import { tavily_search } from "../tools/tavily";
import { RemoveMessage, ToolMessage } from "@langchain/core/messages";
import { getToolCallId } from "../utils/pro";
import { Command } from "@langchain/langgraph";

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
    topics: z.array(z.string()).default([]),
    search_results: z.array(deepSearchResult).default([]),
    report: z.string().default(""),
    lang: z.string().default("zh-CN"),
});

export const think_tool = tool(
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

export const change_research_topic = tool(
    (args, config: ToolRuntime<typeof stateSchema, any>) => {
        const state = config.state;
        const human_message_index = state.messages.findIndex((i) =>
            HumanMessage.isInstance(i),
        );
        const new_messages =
            human_message_index === -1
                ? state.messages
                : state.messages.slice(human_message_index + 1, -1).map((i) => {
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

                    new ToolMessage({
                        name: "change_research_topic",
                        tool_call_id: config.toolCall!.id!,
                        content:
                            "ok, I done change search topic to " +
                            args.new_topic +
                            ", now I will start to search for the new topic, reason: " +
                            args.reason_for_changing_topic,
                    }),
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

export const end_of_research = tool(
    (args, config: ToolRuntime<typeof stateSchema, any>) => {
        const state = config.state;
        return new Command({
            update: {
                search_results: [
                    ...state.search_results,
                    args.search_result_of_current_topic,
                ],
                messages: [
                    ...state.messages,
                    new ToolMessage({
                        name: "end_of_research",
                        tool_call_id: getToolCallId(config),
                        content: "end of research",
                    }),
                ],
            },
        });
    },
    {
        name: "end_of_research",
        returnDirect: true,
        schema: z.object({
            search_result_of_current_topic: webSearchResult.describe(
                "the web search result",
            ),
        }),
    },
);

export const researchTools = [
    tavily_search,
    think_tool,
    change_research_topic,
    end_of_research,
];
