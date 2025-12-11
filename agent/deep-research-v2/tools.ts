import { tool, ToolRuntime, HumanMessage } from "langchain";
import { z } from "zod";
import { RemoveMessage, ToolMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { getToolCallId } from "@langgraph-js/pro";
import { deepSearchResult, webSearchResult, stateSchema } from "./state";

export const think_tool = tool(
    (args) => {
        return `Reflection recorded successfully`;
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

export const ask_user_with_options = tool(
    async (args) => {
        return `user selected: answer will appear in human in the loop reject message`;
    },
    {
        name: "ask_user_with_options",
        description:
            "Ask the user one question with options and optional custom input.",
        schema: z
            .object({
                label: z.string().describe("Question text to display"),
                type: z
                    .enum(["single_select", "multi_select"])
                    .optional()
                    .default("single_select")
                    .describe("Selection mode for this question"),
                options: z
                    .array(
                        z.object({
                            index: z.number().describe("Index of the option"),
                            label: z
                                .string()
                                .describe("Optional display label"),
                        }),
                    )
                    .describe("Selectable options for the question"),
                allow_custom_input: z
                    .boolean()
                    .default(true)
                    .describe("Allow user to input custom text"),
            })
            .describe("The single question to ask the user"),
    },
);
