import { z } from "zod";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { getToolCallId } from "../../utils/pro";
import { stateSchema } from "../tools";
import { generateFinalReport } from "./report-generator";
import { processSearchResults } from "./content-processor";

export const process_research = async (
    state: z.infer<typeof stateSchema>,
    subagent_id: string,
) => {
    // 处理搜索结果：抓取网页内容并压缩

    const { searchResults: processedResults, middleMessages } =
        await processSearchResults(
            state.search_results,
            state.lang,
            subagent_id,
        );

    const appendMessages: BaseMessage[] = [];

    console.log("appendMessages", appendMessages.length);
    console.log("generating report");
    const finalReport = await generateFinalReport(processedResults, state.lang);

    return {
        report: finalReport,
        task_store: {
            [subagent_id]: {
                messages: middleMessages,
            },
        },
        messages: [
            new AIMessage({
                id: crypto.randomUUID(),
                name: "final_report",
                content: finalReport,
            }),
        ],
    };
};
