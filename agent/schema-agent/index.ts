import { entrypoint, MessagesZodMeta } from "@langchain/langgraph";
import { createEntrypointGraph } from "@langgraph-js/pure-graph";
import { z } from "zod";
import { AgentProtocolSchema, createSchemaAgent } from "./agent";
import { ask_subagents, SubAgentStateSchema } from "../tools/ask_subagent";
import { withLangGraph } from "@langchain/langgraph/zod";
import { BaseMessage } from "langchain";
import { noneAgent } from "@/app/agent-store/mockData";

export const AgentGraphState = z
    .object({
        messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
    })
    .merge(AgentProtocolSchema)
    .merge(SubAgentStateSchema);

export const graph = createEntrypointGraph({
    stateSchema: AgentGraphState,
    graph: entrypoint(
        { name: "agent-graph" },
        async (state: z.infer<typeof AgentGraphState>, context?: any) => {
            const protocol = state.agent_protocol;

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
            return response;
        },
    ),
});
