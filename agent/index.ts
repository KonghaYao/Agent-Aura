import { registerGraph } from "@langgraph-js/pure-graph";
import { graph } from "./agent/graph";
import { graph as agentGraph } from "./schema-agent/index";
import { getEnv } from "./getEnv";

if (
    getEnv("NODE_ENV") !== "production" &&
    // @ts-ignore
    !globalThis.Bun
) {
    console.log("register env");
    globalThis.process.env = import.meta.env;
}
// registerGraph("agent", graph);
registerGraph("agent-graph", agentGraph as any);
export default {};
