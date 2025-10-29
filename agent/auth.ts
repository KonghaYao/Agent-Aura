import { MiddlewareHandler } from "hono";
import { LangGraphServerContext } from "@langgraph-js/pure-graph/dist/adapter/hono/index";

export const auth: MiddlewareHandler<{
    Variables: LangGraphServerContext;
}> = async (c, next) => {
    // You can get context from authentication, request data, etc.
    const userId = c.req.header("x-user-id") || "anonymous";

    c.set("langgraph_context", {
        userId,
    });

    await next();
};
