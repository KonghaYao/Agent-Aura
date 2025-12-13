import { entrypoint, MessagesZodMeta } from "@langchain/langgraph";
import {
    createEntrypointGraph,
    createStateEntrypoint,
} from "@langgraph-js/pure-graph";
import { z } from "zod";
import {
    AgentProtocolSchema,
    createSchemaAgent,
    registerPrebuiltAgent,
} from "./agent";
import { ask_subagents, SubAgentStateSchema } from "../tools/ask_subagent";
import { noneAgent } from "../schema-store/agents/noneAgent";
import { graph as deepResearchGraph } from "../deep-research-v2/graph";
import { AgentSchemaList } from "../schema-store";
import { stateSchema as DeepResearchState } from "../deep-research-v2/state";
import { AgentState, mergeState } from "@langgraph-js/pro";
export const AgentGraphState = AgentState.merge(AgentProtocolSchema)
    .merge(SubAgentStateSchema)
    .passthrough();

registerPrebuiltAgent("deep-research-v2", deepResearchGraph);

export const graph = createStateEntrypoint(
    {
        name: "schema-graph",
        stateSchema: AgentGraphState,
    },
    async (state: z.infer<typeof AgentGraphState>, context?: any) => {
        const protocol = AgentSchemaList.find(
            (agent) => agent.id === state.agent_id,
        );
        if (!protocol) {
            throw new Error(`Agent ${state.agent_id} not found`);
        }

        const agent = await createSchemaAgent(
            AgentGraphState,
            protocol,
            state.model_name,
            {
                extra_tools: [
                    ask_subagents((taskId, args) =>
                        createSchemaAgent(
                            AgentGraphState,
                            noneAgent,
                            "gpt-4o-mini",
                            {
                                subagent_id: taskId,
                            },
                        ),
                    ),
                ],
            },
        );

        const response = await agent.invoke(state);
        return mergeState({ ...state, messages: [] }, response);
    },
);
