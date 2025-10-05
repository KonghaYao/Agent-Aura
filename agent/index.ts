import { registerGraph } from "@langgraph-js/pure-graph";
import { graph } from "./agent/graph";
registerGraph("agent", graph);

export default {};
