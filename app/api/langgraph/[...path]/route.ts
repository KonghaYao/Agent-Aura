import {
    GET,
    POST,
    DELETE,
} from "@langgraph-js/pure-graph/dist/adapter/nextjs/router.js";
import { registerGraph } from "@langgraph-js/pure-graph";
import { graph } from "../../../../agent/agent/graph.js";
registerGraph("agent", graph);

export { GET, POST, DELETE };
