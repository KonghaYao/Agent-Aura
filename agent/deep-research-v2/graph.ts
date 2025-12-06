import { stateSchema } from "./tools";
import { research_agent } from "./agent";
import { createStateEntrypoint } from "@langgraph-js/pure-graph";
import { checkLastMessage } from "../utils/checkMessages";
import { process_research } from "./workflow/end_of_search";
import { mergeState } from "../utils/pro";

export const graph = createStateEntrypoint(
    {
        name: "deep_research_v2",
        stateSchema,
    },
    async (state, context?: any) => {
        const search_result_state = await research_agent.invoke(state);
        // 检查是否需要继续处理（是否完成了完整的研究流程）
        if (
            checkLastMessage(search_result_state.messages).isTool(
                "end_of_research",
            ) ||
            search_result_state.search_results.length === 0
        ) {
            const data = await process_research(
                search_result_state,
                search_result_state.messages.at(-1)!.id!,
            );
            return mergeState(search_result_state, data);
        }
        return search_result_state;
    },
);
