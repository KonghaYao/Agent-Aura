import { stateSchema } from "./state";
import { research_agent } from "./agent";
import { createStateEntrypoint } from "@langgraph-js/pure-graph";

import { goDeepResearch } from "./workflow/go-deep-research";
import { mergeState } from "@langgraph-js/pro";
import { createMessagesQuery } from "@langgraph-js/pro";

export const graph = createStateEntrypoint(
    {
        name: "deep_research_v2",
        stateSchema,
    },
    async (state, context?: any) => {
        const search_result_state = await research_agent.invoke(state);
        // 检查是否需要继续处理（是否完成了完整的研究流程）
        if (
            createMessagesQuery()
                .isTool("end_of_research")
                .build()
                .messages(search_result_state.messages)
                .last() &&
            // 有未探索的主题
            search_result_state.search_results.filter(
                (i) => !i.compressed_content,
            ).length > 0
        ) {
            const data = await goDeepResearch(
                search_result_state,
                search_result_state.messages.at(-1)!.id!,
            );
            return mergeState(search_result_state, data);
        }
        return search_result_state;
    },
);
