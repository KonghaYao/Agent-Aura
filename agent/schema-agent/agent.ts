import { AIMessageChunk, createAgent } from "langchain";
import { AgentProtocol } from "./types";
import { createTools } from "./tools";
import { FileUploadMiddleware } from "../middlewares/FileUploadMiddleware";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { z } from "zod";
import { ClientTool, ServerTool } from "@langchain/core/tools";

export const AgentProtocolSchema = z.object({
    agent_protocol: z.custom<AgentProtocol>(),
    model_name: z.string(),
});

export const createLLM = async (
    protocol: AgentProtocol,
    model_name?: string,
    options: {
        subagent_id?: string;
    } = {},
) => {
    if (!model_name) {
        model_name = protocol.llm[0].model;
    } else {
        const llm = protocol.llm.find((i) => i.model === model_name);
        if (!llm) {
            throw new Error(`Model ${model_name} not found`);
        }
        model_name = llm.model;
    }
    if (protocol.llm[0].provider === "anthropic") {
        // return new ChatAnthropic({
        //     model: model_name,
        //     streamUsage: true,
        //     streaming: true,
        // });
    }
    return new ChatOpenAI({
        model: model_name,
        streamUsage: true,
        streaming: true,
        useResponsesApi: false,
        metadata: {
            // message 通过这个 id 判断是否为子调用
            subagent_id: options.subagent_id,
        },
    });
};
export const createSchemaAgent = async (
    stateSchema: any,
    protocol: AgentProtocol,
    select_model_name: string,
    options: {
        extra_tools?: ClientTool[];
        subagent_id?: string;
    } = {},
) => {
    const [tools, model] = await Promise.all([
        createTools(protocol),
        createLLM(protocol, select_model_name, {
            subagent_id: options.subagent_id,
        }),
    ] as const);
    return createAgent({
        // 工具调用数据，可以通过这个参数判断是否为子调用
        name: options.subagent_id
            ? `subagent_${options.subagent_id}`
            : undefined,
        model,
        tools: [...tools, ...(options.extra_tools || [])] as (
            | ClientTool
            | ServerTool
        )[],
        systemPrompt: protocol.systemPrompt,
        middleware: [FileUploadMiddleware()],
        stateSchema,
    });
};
