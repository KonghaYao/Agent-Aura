import { registerGraph } from "@langgraph-js/pure-graph";
import { graph } from "./agent/graph";
import { graph as debateGraph } from "./debate/graph";
registerGraph("agent", graph);
registerGraph("debate", debateGraph);
if (!globalThis.process.env) {
    globalThis.process.env = import.meta.env;
}
export default {};
