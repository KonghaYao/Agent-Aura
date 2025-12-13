import {
    AIMessage,
    BaseMessage,
    tool,
    ToolMessage,
    ToolRuntime,
} from "langchain";
import { Command } from "@langchain/langgraph";
import { stateSchema } from "../state";
import { z } from "zod";
import { getToolCallId } from "@langgraph-js/pro";
import { generateFinalReport } from "./report-generator";
import { processSearchResults } from "./compress-docs";

export const start_deep_research = tool(
    async (args, config: ToolRuntime<typeof stateSchema, any>) => {
        const state = config.state;
        // 检查是否需要继续处理（是否完成了完整的研究流程）
        if (
            // 有未探索的主题
            state.search_results.filter((i) => !i.compressed_content).length > 0
        ) {
            const subagent_id = getToolCallId(config);
            const { searchResults: processedResults, middleMessages } =
                await processSearchResults(
                    state.model_name,
                    // 忽略掉已经探索过的主题
                    state.search_results.filter((i) => !i.compressed_content),
                    state.lang,
                    subagent_id,
                );

            const appendMessages: BaseMessage[] = [];

            console.log("appendMessages", appendMessages.length);
            console.log("generating report");
            const finalReport = await generateFinalReport(
                state.model_name,
                processedResults,
                state.lang,
            );

            const new_state = {
                task_store: {
                    [subagent_id]: {
                        messages: middleMessages,
                    },
                },
                messages: [
                    new ToolMessage({
                        content: `我们已经探索了以下主题：
${processedResults.map((r) => `- ${r.topic}`).join("\n")}`,
                        tool_call_id: subagent_id,
                    }),
                    new AIMessage({
                        name: "final_report",
                        content: finalReport,
                    }),
                ],
                search_results: processedResults,
            };
            return new Command({
                update: new_state,
            });
        }
        return "none, no search topic";
    },
    {
        name: "start_deep_research",
        description: "start the deep research",
        schema: z.object({
            topic: z.string().describe("the topic of the research"),
        }),
        returnDirect: true,
    },
);
