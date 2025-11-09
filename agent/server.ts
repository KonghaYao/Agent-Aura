import "./index";
import { Hono } from "hono";
import LangGraphApp, {
    LangGraphServerContext,
} from "@langgraph-js/pure-graph/dist/adapter/hono/index";
import { auth } from "./auth";
import { filesRouter } from "./filestore/routes";

const app = new Hono<{ Variables: LangGraphServerContext }>();

// Middleware to inject custom context
app.use("/api/*", auth);

// 集成路由
app.route("/api/langgraph", LangGraphApp);
app.route("/api/files", filesRouter);

export default app;
