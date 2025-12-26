import { getEnv } from "@/agent/utils/getEnv";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
    baseURL: import.meta.env.PUBLIC_AGENT_URL,
});
