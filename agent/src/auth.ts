import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";

const getUserFromRequest = async (
    request: Request,
): Promise<{
    isAuthenticated: boolean;
    userInfo: {
        id?: string;
    };
}> => {
    return {
        isAuthenticated: true,
        userInfo: {
            id: request.headers.get("Authorization")?.split(" ")[1],
        },
    };
};

export const auth = new Auth()
    .authenticate(async (request: Request) => {
        try {
            const userId = await getUserFromRequest(request);
            if (!userId?.isAuthenticated || !userId.userInfo.id) {
                throw new HTTPException(401, {
                    message: "LangGraph: Invalid token",
                    cause: userId,
                });
            }
            return {
                identity: userId.userInfo!.id!,
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
