import { auth } from "@/lib/auth"; // 导入你的 Better Auth 实例
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const isAuthed = await auth.api.getSession({
        headers: context.request.headers,
    });
    if (
        context.url.pathname !== "/" &&
        !context.url.pathname.startsWith("/api") &&
        !context.url.pathname.startsWith("/auth") &&
        !isAuthed
    ) {
        return context.redirect("/auth");
    }
    return next();
});
