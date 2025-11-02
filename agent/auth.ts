import { MiddlewareHandler } from "hono";
import { LangGraphServerContext } from "@langgraph-js/pure-graph/dist/adapter/hono/index";
import { auth as BetterAuth } from "../lib/auth";

export const auth: MiddlewareHandler<{
    Variables: LangGraphServerContext;
}> = async (c, next) => {
    const session = await BetterAuth.api.getSession({
        headers: c.req.raw.headers,
    });
    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    } else {
        c.set("langgraph_context", {
            userId: session.user.id,
        });
        await next();
    }
};
