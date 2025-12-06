import { z } from "zod";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { stateSchema } from "../state";
import { generateFinalReport } from "./report-generator";
import { processSearchResults } from "./compress-docs";

export const goDeepResearch = async (
    state: z.infer<typeof stateSchema>,
    subagent_id: string,
) => {
    // 处理搜索结果：抓取网页内容并压缩

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

    return {
        task_store: {
            [subagent_id]: {
                messages: middleMessages,
            },
        },
        messages: [
            new AIMessage({
                name: "final_report",
                content: `我们已经探索了以下主题：${processedResults
                    .map((r) => r.topic)
                    .join("、")}`,
            }),
            new AIMessage({
                id: crypto.randomUUID(),
                name: "final_report",
                content: finalReport,
            }),
        ],
    };
};
