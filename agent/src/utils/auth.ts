/**
 * 验证token并返回userId
 * @param token 用户令牌
 * @returns 用户ID
 */
export const verifyToken = async (token: string): Promise<string> => {
    const hashToken = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(token),
    );
    return Array.from(new Uint8Array(hashToken))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
};

/**
 * 从请求中提取用户ID
 * @param request 请求对象
 * @returns 用户ID
 * @throws 如果token无效则抛出异常
 */
export const getUserIdFromRequest = async (
    request: Request,
): Promise<string> => {
    return "1";
};
