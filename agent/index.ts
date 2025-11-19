import { registerGraph } from "@langgraph-js/pure-graph";
import { graph as agentGraph } from "./schema-agent/index";
import { graph as deepResearchGraph } from "./deep-research-v2/graph";
import { getEnv } from "./getEnv";

if (
    getEnv("NODE_ENV") !== "production" &&
    // @ts-ignore
    !globalThis.Bun &&
    // @ts-ignore
    !globalThis.Deno
) {
    globalThis.process.env = import.meta.env;
}

registerGraph("deep-research", deepResearchGraph);
registerGraph("agent-graph", agentGraph);

export default {};
