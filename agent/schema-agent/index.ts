import { createStateEntrypoint } from "@langgraph-js/pure-graph";
import { z } from "zod";
import {
    AgentProtocolSchema,
    createSchemaAgent,
    registerPrebuiltAgent,
} from "./agent";
import { ask_subagents, SubAgentStateSchema } from "../tools/ask_subagent";

import { graph as deepResearchGraph } from "../deep-research-v2/graph";
import { AgentSchemaList } from "../schema-store";
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
                    ask_subagents((taskId, args, state) => {
                        const subagentProtocol = AgentSchemaList.find(
                            (agent) => agent.id === args.subagent_id,
                        );
                        if (!subagentProtocol) {
                            throw new Error(
                                `Agent ${args.subagent_id} not found`,
                            );
                        }

                        return createSchemaAgent(
                            AgentGraphState,
                            {
                                ...subagentProtocol,
                                systemPrompt: `${
                                    subagentProtocol.systemPrompt
                                }\n${
                                    protocol.subAgents.find(
                                        (i) =>
                                            i.protocolId === args.subagent_id,
                                    )?.extraSystemPrompt || ""
                                }`,
                            },
                            state.model_name,
                            {
                                subagent_id: taskId,
                            },
                        );
                    }),
                ],
            },
        );

        const response: z.infer<typeof AgentGraphState> = await agent.invoke(
            state,
        );
        response.messages = response.messages.filter(
            (msg) => !state.messages.find((i) => i.id === msg.id),
        );
        return mergeState(state, response);
    },
);
