import "./index";
import { Hono } from "hono";
import LangGraphApp, {
    LangGraphServerContext,
} from "@langgraph-js/pure-graph/dist/adapter/hono/index";

const app = new Hono<{ Variables: LangGraphServerContext }>();

// Middleware to inject custom context
app.use("/api/langgraph/*", async (c, next) => {
    // You can get context from authentication, request data, etc.
    const userId = c.req.header("x-user-id") || "anonymous";
    const sessionId = c.req.header("x-session-id") || "session-123";

    c.set("langgraph_context", {
        userId,
        sessionId,
        preferences: { theme: "dark", language: "zh" },
        metadata: { source: "hono-app", timestamp: new Date().toISOString() },
        // Add any custom fields your graph needs
    });

    await next();
});
app.route("/api/langgraph", LangGraphApp);
export default app;
