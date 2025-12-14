import { CompiledGraph } from "@langchain/langgraph";
import { research_agent } from "./agent";
export const graph = research_agent as any as CompiledGraph<
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
>;
