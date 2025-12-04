import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { LangGraphServerContext } from "@langgraph-js/pure-graph/dist/adapter/hono/index.js";
import { AgentSchemaList } from "./index";

// 扩展上下文类型以包含自定义变量
type ExtendedContext = LangGraphServerContext & {
    userId: string;
};

// 创建路由实例
export const agentsRouter = new Hono<{ Variables: ExtendedContext }>();

const getAgentsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    offset: z.coerce.number().int().min(0).optional().default(0),
    q: z.string().optional(), // 搜索关键词
});

// 中间件：获取用户ID（从认证上下文中）
agentsRouter.use("*", async (c, next) => {
    // 从认证上下文中获取用户ID（需要与auth中间件配合使用）
    const userId = c.get("langgraph_context")?.userId;
    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("userId", userId);
    await next();
});

// 获取 agent 列表
agentsRouter.get("/", zValidator("query", getAgentsQuerySchema), async (c) => {
    try {
        const query = c.req.valid("query");
        const { limit, offset, q } = query;

        let filteredAgents = AgentSchemaList;

        if (q) {
            const lowerCaseQ = q.toLowerCase();
            filteredAgents = AgentSchemaList.filter(
                (agent) =>
                    agent.name.toLowerCase().includes(lowerCaseQ) ||
                    agent.description.toLowerCase().includes(lowerCaseQ),
            );
        }

        const paginatedAgents = filteredAgents.slice(offset, offset + limit);

        return c.json({ data: paginatedAgents, total: filteredAgents.length });
    } catch (error) {
        console.error("获取 agent 列表失败:", error);
        return c.json({ error: "获取 agent 列表失败" }, 500);
    }
});

// 根据 ID 获取单个 agent
agentsRouter.get("/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const agent = AgentSchemaList.find((a) => a.id === id);

        if (!agent) {
            return c.json({ error: "Agent 不存在" }, 404);
        }

        return c.json({ data: agent });
    } catch (error) {
        console.error("获取 agent 失败:", error);
        return c.json({ error: "获取 agent 失败" }, 500);
    }
});
