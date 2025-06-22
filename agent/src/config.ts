import type { LogtoHonoConfig } from "./routes/auth/auth";

export const LogtoConfig: LogtoHonoConfig = {
    endpoint: process.env.AUTH_ENDPOINT!,
    appId: process.env.AUTH_APP_ID!,
    appSecret: process.env.AUTH_APP_SECRET!,
    cookieSecret: process.env.AUTH_COOKIE_NAME!,
    fetchUserInfo: true,
    cookieSecure: process.env.NODE_ENV === "production",
    callbackUrl: {
        signIn: process.env.AUTH_CALLBACK_URL!,
        signOut: process.env.AUTH_CALLBACK_URL!,
    },
};
