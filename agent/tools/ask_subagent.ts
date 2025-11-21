import { Command } from "@langchain/langgraph";
import { HumanMessage, ReactAgent, tool } from "langchain";
import { z } from "zod";
import { createSchemaAgent } from "../schema-agent/agent";
import { noneAgent } from "../../app/agent-store/mockData";
import { Message } from "@langchain/core/messages";
import { type ToolRuntime } from "@langchain/core/tools";
import { withLangGraph } from "@langchain/langgraph/zod";

export const SubAgentStateSchema = z.object({
    task_store: z.custom().default({}),
});

const schema = z.object({
    task_id: z.string().optional(),
    subagent_id: z.string(),
    question: z.string(),
    data_transfer: z.any(),
});

export const ask_subagents = (
    agentCreator: (
        task_id: string,
        args: z.infer<typeof schema>,
    ) => Promise<any>,
) =>
    tool(
        async (args, config: ToolRuntime<typeof SubAgentStateSchema, any>) => {
            const state = config.state;
            const taskId: string = args.task_id || config.toolCall!.id!;
            let sub_state = {
                messages: [] as Message[],
            };
            if (taskId && (state as any)?.["task_store"]?.[taskId]) {
                sub_state = (state as any)?.["task_store"][taskId];
            }

            const agent = await agentCreator(taskId, args);
            sub_state.messages.push(
                new HumanMessage({ content: args.question }),
            );
            const new_state = await agent.invoke(sub_state as any);
            const last_message = new_state["messages"].at(-1);
            return new Command({
                update: {
                    task_store: {
                        ...((state as any)?.["task_store"] || {}),
                        [taskId]: new_state,
                    },
                    messages: [
                        {
                            role: "tool",
                            content:
                                `task_id: ${taskId}\n---` +
                                (last_message?.text || ""),
                            tool_call_id: config.toolCall!.id!,
                        },
                    ],
                },
            });
        },
        {
            name: "ask_subagents",
            description: "ask subagents to help you",
            schema,
        },
    );
