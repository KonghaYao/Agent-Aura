import "./index";
import { Hono } from "hono";
import LangGraphApp, {
    LangGraphServerContext,
} from "@langgraph-js/pure-graph/dist/adapter/hono/index";

const app = new Hono<{ Variables: LangGraphServerContext }>();

// Middleware to inject custom context
app.use("/*", async (c, next) => {
    // You can get context from authentication, request data, etc.
    const userId = c.req.header("x-user-id") || "anonymous";

    c.set("langgraph_context", {
        userId,
    });

    await next();
});
app.route("/", LangGraphApp);
export default app;
