import "./index";
import { Hono } from "hono";
import LangGraphApp, {
    LangGraphServerContext,
} from "@langgraph-js/pure-graph/dist/adapter/hono/index";
import { auth } from "./auth";
import { cors } from "hono/cors";
import { getEnv } from "./getEnv";
import { filesRouter } from "./filestore/routes";
import { type AuthType, auth as betterAuth } from "../lib/auth";
const app = new Hono<{ Variables: LangGraphServerContext }>();

// Middleware to inject custom context
app.use(
    "/*",
    cors({
        origin: "https://" + getEnv("AUTH_COOKIE_DOMAIN"),
        allowMethods: ["POST", "GET", "OPTIONS", "DELETE", "PUT", "PATCH"],
        maxAge: 600,
        credentials: true,
    }),
    auth,
);

app.route("/api/langgraph", LangGraphApp);
app.route("/api/files", filesRouter);

const authRouter = new Hono<{ Bindings: AuthType }>({
    strict: false,
});
authRouter.on(["POST", "GET"], "/auth/*", (c) => {
    return betterAuth.handler(c.req.raw);
});

app.route("/api/auth", authRouter);

export default {
    idleTimeout: 120,
    fetch: app.fetch,
    port: 8123,
};
