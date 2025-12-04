import "./index";
import { Hono } from "hono";
import LangGraphApp, {
    LangGraphServerContext,
} from "@langgraph-js/pure-graph/dist/adapter/hono/index.js";
import { auth } from "./auth";
import { filesRouter } from "./filestore/routes";
import { type AuthType, auth as betterAuth } from "../lib/auth";
import { logger } from "hono/logger";
import { agentsRouter } from "./schema-store/routes";

const app = new Hono<{ Variables: LangGraphServerContext }>();
app.use(logger());

const authRouter = new Hono<{ Bindings: AuthType }>({
    strict: false,
});
authRouter.on(["POST", "GET"], "/*", (c) => {
    return betterAuth.handler(c.req.raw);
});
app.route("/api/auth", authRouter);

// Middleware to inject custom context
app.use("/*", auth);

app.route("/api/langgraph", LangGraphApp);
app.route("/api/files", filesRouter);
app.route("/api/agents", agentsRouter);
export default {
    idleTimeout: 120,
    fetch: app.fetch,
    port: 8123,
};
