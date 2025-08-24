import { interrupt, entrypoint } from "@langchain/langgraph";
import { GraphState, createLLM } from "./state.js";
import {
    SequentialThinkingTool,
    createFeTools,
    createSwarm,
} from "@langgraph-js/pro";
import { tool } from "@langchain/core/tools";
import { type ToolRunnableConfig } from "@langchain/core/tools";
import z from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { create_artifacts } from "../tools/create_artifacts.js";
import { getPrompt } from "./getPrompt.ts";
import { image_generation } from "../tools/image_generation.ts";
import { tavilyCrawlTool, tavilySearchTool } from "../tools/tavily.ts";
// import { add_memories, search_memory } from "../memory/tools.ts";
// import { image_generation } from "../tools/image_generation.ts";
const ask_user_for_approve = tool(
    async (input, _config: ToolRunnableConfig) => {
        const data = interrupt(JSON.stringify(input));
        return [data, null];
    },
    {
        name: "ask_user_for_approve",
        description:
            "Request user review and approval for plans or content, wait for user feedback before proceeding",
        schema: z.object({
            title: z
                .string()
                .describe("Title or subject of the content to be reviewed"),
        }),
        responseFormat: "content_and_artifact",
    },
);

const AuraMainAgent = entrypoint(
    "main",
    async (state: typeof GraphState.State, config) => {
        const feTools = await createFeTools(state.fe_tools);
        const executorPrompt = await getPrompt("executor", false);
        const artifactsPrompt = await getPrompt("artifacts-usage", false);
        const stylePrompt = await getPrompt("style", false);
        const tools = [
            ask_user_for_approve,
            tavilySearchTool,
            tavilyCrawlTool,
            SequentialThinkingTool,
            create_artifacts,
            image_generation,
            // search_memory,
            // add_memories,
            ...feTools,
        ];
        const llm = await createLLM(state, "main_model");

        const agent = createReactAgent({
            llm,
            tools,
            prompt:
                executorPrompt + "\n" + artifactsPrompt + "\n" + stylePrompt,
        });

        const response = await agent.invoke({
            messages: state.messages,
        });

        return {
            messages: response.messages,
        };
    },
);

export const graph = createSwarm({
    /** @ts-ignore */
    agents: [AuraMainAgent],
    defaultActiveAgent: "main",
    stateSchema: GraphState,
}).compile({ name: "AuraAgent" });
