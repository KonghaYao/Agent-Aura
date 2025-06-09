import { Annotation, BaseStore } from "@langchain/langgraph";
import { SwarmState } from "@langchain/langgraph-swarm";
import { createState, FEToolsState } from "@langgraph-js/pro";
import { createModelHelper } from "@langgraph-js/pro";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";

export const { ModelState, createLLM } = createModelHelper({
    main_model: ["gemini-2.5-flash-preview-05-20"],
});
export const GraphState = createState(
    createReactAgentAnnotation(),
    ModelState,
    FEToolsState,
    SwarmState
).build({});
export type GraphState = typeof GraphState.State;

export const ConfigurationState = createState().build({
    store: Annotation<BaseStore>(),
    metadata: Annotation<{
        userId: string;
    }>(),
});
