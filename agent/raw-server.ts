import "./index";
import { Hono } from "hono";
import LangGraphApp, {
    LangGraphServerContext,
} from "@langgraph-js/pure-graph/dist/adapter/hono/index";
import { auth } from "./auth";
import { cors } from "hono/cors";
import { getEnv } from "./getEnv";
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
app.route("/", LangGraphApp);
export default app;
