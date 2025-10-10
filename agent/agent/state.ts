import { Annotation, BaseStore } from "@langchain/langgraph";
import { createState, FEToolsState, SwarmState } from "@langgraph-js/pro";
import { createModelHelper, createDefaultAnnotation } from "@langgraph-js/pro";
import { models } from "../models";

export const { ModelState, createLLM } = createModelHelper(models);
export const GraphState = createState(
    ModelState,
    FEToolsState,
    SwarmState,
).build({
    memory_prompt: createDefaultAnnotation<string>(() => ""),
});
export type GraphState = typeof GraphState.State;

export const ConfigurationState = createState().build({
    store: Annotation<BaseStore>(),
    metadata: Annotation<{
        userId: string;
    }>(),
});
