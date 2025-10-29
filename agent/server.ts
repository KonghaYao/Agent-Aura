import "./index";
import { Hono } from "hono";
import LangGraphApp, {
    LangGraphServerContext,
} from "@langgraph-js/pure-graph/dist/adapter/hono/index";
import { auth } from "./auth";

const app = new Hono<{ Variables: LangGraphServerContext }>();

// Middleware to inject custom context
app.use("/api/langgraph/*", auth);
app.route("/api/langgraph", LangGraphApp);
export default app;
