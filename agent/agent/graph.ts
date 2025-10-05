import { entrypoint } from "@langchain/langgraph";
import { GraphState, createLLM } from "./state.js";
import { createFeTools, createSwarm } from "@langgraph-js/pro";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { create_artifacts } from "../tools/create_artifacts.js";
import { getPrompt } from "./getPrompt.js";
import { image_generation } from "../tools/image_generation.js";
import { tavilyCrawlTool, tavilySearchTool } from "../tools/tavily.js";

const AuraMainAgent = entrypoint(
    "main",
    async (state: typeof GraphState.State, config) => {
        const feTools = await createFeTools(state.fe_tools);
        const executorPrompt = await getPrompt("executor", false);
        const artifactsPrompt = await getPrompt("artifacts-usage", false);
        const stylePrompt = await getPrompt("style", false);
        const tools = [
            tavilySearchTool,
            tavilyCrawlTool,
            create_artifacts,
            image_generation,
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
