import { Hono } from "hono";
import { store } from "../memory";
import { getUserIdFromRequest } from "../utils/auth";

// 定义自定义上下文类型
type Variables = {
    userId: string;
};

const memoryRouter = new Hono<{
    Variables: Variables;
}>();

// 初始化存储
memoryRouter.use(async (c, next) => {
    // 确保存储已初始化
    await store.initialize();
    await next();
});

// 获取用户ID中间件
const withUserId = async (c: any, next: () => Promise<void>) => {
    try {
        const userId = await getUserIdFromRequest(c.req.raw);
        c.set("userId", userId);
        await next();
    } catch (error) {
        return c.json({ error: "认证失败" }, 401);
    }
};

// 应用用户ID中间件到所有路由
memoryRouter.use(withUserId);

// 获取特定记忆
memoryRouter.get("/use/:key", async (c) => {
    const userId = c.get("userId");
    const key = c.req.param("key");

    try {
        const value = await store.get(userId, key);
        if (!value) {
            return c.json({ error: "记忆不存在" }, 404);
        }
        return c.json({ value });
    } catch (error) {
        console.error("获取记忆失败:", error);
        return c.json({ error: "获取记忆失败" }, 500);
    }
});

// 搜索记忆
memoryRouter.get("/search", async (c) => {
    const userId = c.get("userId");
    const query = c.req.query("query") || "";
    const limitStr = c.req.query("limit");
    const limit = limitStr ? parseInt(limitStr, 10) : 5;

    try {
        const results = await store.search(userId, query, limit);
        return c.json({ results });
    } catch (error) {
        console.error("搜索记忆失败:", error);
        return c.json({ error: "搜索记忆失败" }, 500);
    }
});

// 存储记忆
memoryRouter.put("/use/:key", async (c) => {
    const userId = c.get("userId");
    const key = c.req.param("key");

    try {
        const body = await c.req.json();
        const value = body.value;

        if (typeof value !== "string") {
            return c.json({ error: "value必须是字符串" }, 400);
        }

        await store.put(userId, key, value);
        return c.json({ success: true });
    } catch (error) {
        console.error("存储记忆失败:", error);
        return c.json({ error: "存储记忆失败" }, 500);
    }
});

// 删除记忆
memoryRouter.delete("/use/:key", async (c) => {
    const userId = c.get("userId");
    const key = c.req.param("key");

    try {
        await store.delete(userId, key);
        return c.json({ success: true });
    } catch (error) {
        console.error("删除记忆失败:", error);
        return c.json({ error: "删除记忆失败" }, 500);
    }
});

export default memoryRouter;
