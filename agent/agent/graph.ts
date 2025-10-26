import { entrypoint, getConfig } from "@langchain/langgraph";
import { GraphState, createLLM } from "./state";
import { createFeTools, createSwarm } from "@langgraph-js/pro";
import { z } from "zod";
import { createAgent } from "langchain";
import { create_artifacts } from "../tools/create_artifacts";
import { getPrompt } from "./getPrompt";
// import { image_generation } from "../tools/image_generation";
import { tavily_extract, tavily_search } from "../tools/tavily";
import { getBackgroundMemory, saveMemory, wrapMemoryMessages } from "../memory";

const AuraMainAgent = entrypoint(
    "main",
    async (state: typeof GraphState.State) => {
        const config = getConfig();
        const feTools = await createFeTools(state.fe_tools);
        const executorPrompt = await getPrompt("executor", false);
        const artifactsPrompt = await getPrompt("artifacts-usage", false);
        const stylePrompt = await getPrompt("style", false);
        const tools = [
            tavily_extract,
            tavily_search,
            create_artifacts,
            // image_generation,
            ...feTools,
        ];
        const model = await createLLM(state, "main_model");
        // const memoryPrompt = await getBackgroundMemory(config);
        const agent = createAgent({
            model,
            tools,
            systemPrompt:
                executorPrompt + "\n" + artifactsPrompt + "\n" + stylePrompt,
            // "\n" +
            // memoryPrompt,
        });
        const response = await agent.invoke({
            messages: state.messages,
            // messages: await wrapMemoryMessages(state.messages, config),
        });

        return {
            messages: response.messages,
            // messages: await saveMemory(response.messages, config),
        };
    },
);

export const graph = createSwarm({
    /** @ts-ignore */
    agents: [AuraMainAgent],
    defaultActiveAgent: "main",
    stateSchema: GraphState,
}).compile({ name: "AuraAgent" });
