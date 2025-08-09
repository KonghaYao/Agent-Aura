import { MemoryBase, createMemoryAgent } from "./index";
import { createLLM } from "../agent/state";
import { createState } from "@langgraph-js/pro";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
import { START, StateGraph } from "@langchain/langgraph";

const llm = await createLLM(
    { main_model: "qwen-plus", reasoning_model: "gpt-4o-mini" },
    "main_model",
);
const memoryModel = await createLLM(
    {
        main_model: "qwen-turbo",
        reasoning_model: "gpt-4o",
    },
    "main_model",
);
const memory = new MemoryBase(memoryModel);
const stateSchema = createState(createReactAgentAnnotation()).build();
export const graph = new StateGraph(stateSchema)
    .addNode("main-node", async (state) => {
        const agent = createMemoryAgent({
            name: "memory",
            memory,
            llm,
            prompt: `你是一个好助手`,
            tools: [],
            stateSchema: stateSchema,
        });
        const agentResponse = await agent.invoke({ messages: state.messages });
        return { messages: agentResponse.messages };
    })
    .addEdge(START, "main-node");
