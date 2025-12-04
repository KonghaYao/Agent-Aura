import "./index";
import { Hono } from "hono";
import LangGraphApp, {
    LangGraphServerContext,
} from "@langgraph-js/pure-graph/dist/adapter/hono/index";
import { auth } from "./auth";
import { filesRouter } from "./filestore/routes";
import { agentsRouter } from "./schema-store/routes";

const app = new Hono<{ Variables: LangGraphServerContext }>();

// Middleware to inject custom context
app.use("/api/*", auth);

// 集成路由
app.route("/api/langgraph", LangGraphApp);
app.route("/api/files", filesRouter);
app.route("/api/agents", agentsRouter);

export default app;
