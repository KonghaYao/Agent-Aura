import { entrypoint, getConfig } from "@langchain/langgraph";
import { GraphState, createLLM } from "./state";
import { createFeTools, createSwarm } from "@langgraph-js/pro";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import { create_artifacts } from "../tools/create_artifacts";
import { getPrompt } from "./getPrompt";
// import { image_generation } from "../tools/image_generation";
import { tavily_extract, tavily_search } from "../tools/tavily";
import { getBackgroundMemory, saveMemory, wrapMemoryMessages } from "../memory";
import { RunnableConfig } from "@langchain/core/runnables";

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
            // create_artifacts,
            // image_generation,
            ...feTools,
        ];
        const llm = await createLLM(state, "main_model");

        const memoryPrompt =
            state.memory_prompt || (await getBackgroundMemory(config));
        const agent = createReactAgent({
            llm,
            tools,
            prompt:
                executorPrompt +
                "\n" +
                artifactsPrompt +
                "\n" +
                stylePrompt +
                "\n" +
                memoryPrompt,
        });
        const response = await agent.invoke({
            messages: await wrapMemoryMessages(state.messages, config),
        });

        return {
            messages: await saveMemory(response.messages, config),
        };
    },
);

export const graph = createSwarm({
    /** @ts-ignore */
    agents: [AuraMainAgent],
    defaultActiveAgent: "main",
    stateSchema: GraphState,
}).compile({ name: "AuraAgent" });
