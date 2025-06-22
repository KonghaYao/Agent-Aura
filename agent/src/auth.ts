import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";
import { getUserFromRequest } from "./routes/auth/auth";
import { LogtoConfig } from "./config";

export const auth = new Auth()
    .authenticate(async (request: Request) => {
        try {
            if (new URL(request.url).pathname.startsWith("/auth")) {
                return {
                    identity: "1",
                    permissions: [],
                };
            }
            const userId = await getUserFromRequest(LogtoConfig)(request);
            if (!userId?.isAuthenticated) {
                throw new HTTPException(401, {
                    message: "LangGraph: Invalid token",
                    cause: userId,
                });
            }
            return {
                identity: userId.userInfo!.sub,
                permissions: [],
                cookies: request.headers.get("cookies"),
            };
        } catch (error) {
            throw new HTTPException(401, {
                message: "LangGraph: Invalid token",
                cause: error,
            });
        }
    })
    .on("*", ({ value, user, event }) => {
        // Add owner to the resource metadata
        if ("metadata" in value) {
            value.metadata ??= {};
            value.metadata.owner = user.identity;
            value.metadata.userId = user.identity;
        }
        // 用户可以查看自己的 assistant
        if (event === "assistants:search") {
            return;
        }
        // Filter the resource by the owner
        return { owner: user.identity };
    })
    // 给予读取权限
    .on("assistants:read", () => {
        return {};
    })
    .on("store", ({ user, value }) => {
        if (value.namespace != null) {
            // Assuming you organize information in store like (user_id, resource_type, resource_id)
            const [userId] = value.namespace;
            if (userId !== user.identity) {
                throw new HTTPException(403, { message: "Not authorized" });
            }
        }
    });
