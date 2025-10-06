import { Annotation, BaseStore } from "@langchain/langgraph";
import { createState, FEToolsState, SwarmState } from "@langgraph-js/pro";
import { createModelHelper } from "@langgraph-js/pro";
import { models } from "../models";

export const { ModelState, createLLM } = createModelHelper(models);
export const GraphState = createState(
    ModelState,
    FEToolsState,
    SwarmState,
).build({});
export type GraphState = typeof GraphState.State;

export const ConfigurationState = createState().build({
    store: Annotation<BaseStore>(),
    metadata: Annotation<{
        userId: string;
    }>(),
});
