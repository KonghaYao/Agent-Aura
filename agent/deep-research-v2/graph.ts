import { Command, END, START, StateGraph } from "@langchain/langgraph";
import { z } from "zod";
import { AIMessage } from "@langchain/core/messages";
import { stateSchema } from "./tools";
import { research_agent } from "./agent";
import { processSearchResults } from "./content-processor";
import { generateFinalReport } from "./report-generator";
import { checkLastMessage } from "../utils/checkMessages";

export const graph = new StateGraph(stateSchema)
    .addSequence([
        [
            "research",
            async (state: z.infer<typeof stateSchema>, context?: any) => {
                // Research phase
                const search_result_state = await research_agent.invoke(state);

                // 检查是否需要继续处理（是否完成了完整的研究流程）
                if (
                    checkLastMessage(search_result_state.messages).isTool(
                        "end_of_research",
                    ) ||
                    search_result_state.search_results.length === 0
                ) {
                    // 简单问答模式，无需后续处理
                    return new Command({
                        goto: END,
                        update: search_result_state,
                    });
                }
                return search_result_state;
            },
        ],
        [
            "process_results",
            async (state: z.infer<typeof stateSchema>, context?: any) => {
                // 处理搜索结果：抓取网页内容并压缩
                const processedResults = await processSearchResults(
                    state.search_results,
                    state.lang,
                );

                const appendMessages = [];
                // 将压缩后的内容添加到消息中
                processedResults.forEach((result) => {
                    if (result.compressed_content) {
                        appendMessages.push(
                            new AIMessage({
                                id: crypto.randomUUID(),
                                name: "compressed_content",
                                content: result.compressed_content,
                            }),
                        );
                    }
                });
                console.log("appendMessages", appendMessages.length);
                console.log("generating report");
                const finalReport = await generateFinalReport(
                    processedResults,
                    state.lang,
                );

                return {
                    report: finalReport,
                    messages: [
                        ...appendMessages,
                        new AIMessage({
                            id: crypto.randomUUID(),
                            name: "final_report",
                            content: finalReport,
                        }),
                    ],
                };
            },
        ],
    ])
    .addEdge(START, "research")
    .compile();
