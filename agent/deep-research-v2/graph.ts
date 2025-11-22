import { entrypoint } from "@langchain/langgraph";
import { createEntrypointGraph } from "@langgraph-js/pure-graph";
import { z } from "zod";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { stateSchema, deepSearchResult } from "./tools";
import { research_agent } from "./agent";
import { processSearchResults } from "./content-processor";
import { generateFinalReport } from "./report-generator";

export const graph = createEntrypointGraph({
    stateSchema,
    graph: entrypoint<z.infer<typeof stateSchema>, any>(
        { name: "deep-research-v2" },
        async (state: z.infer<typeof stateSchema>, context?: any) => {
            // Research phase
            const search_result_state = await research_agent.invoke(state);

            // 检查是否需要继续处理（是否完成了完整的研究流程）
            if (
                (ToolMessage.isInstance(search_result_state.messages.at(-1)) &&
                    search_result_state.messages.at(-1)?.name !==
                        "end_of_research") ||
                search_result_state.search_results.length === 0
            ) {
                // 简单问答模式，无需后续处理
                return search_result_state;
            }

            // 处理搜索结果：抓取网页内容并压缩
            const processedResults = await processSearchResults(
                search_result_state.search_results,
                state.lang,
            );

            // 将压缩后的内容添加到消息中
            processedResults.forEach((result) => {
                if (result.compressed_content) {
                    search_result_state.messages.push(
                        new AIMessage({
                            name: "compressed_content",
                            content: result.compressed_content,
                        }),
                    );
                }
            });

            // 生成最终报告
            console.log("generating report");
            const finalReport = await generateFinalReport(
                processedResults,
                state.lang,
            );
            search_result_state.report = finalReport;
            search_result_state.messages.push(
                new AIMessage({
                    name: "final_report",
                    content: finalReport,
                }),
            );

            return search_result_state;
        },
    ),
});
