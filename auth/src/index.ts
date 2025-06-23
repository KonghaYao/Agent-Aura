import { Hono } from "hono";
import { handleAuthRoutes, LogtoHonoConfig } from "./auth";
import { cors } from "hono/cors";
const app = new Hono();
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

app.use(
    cors({
        origin: ["http://localhost:3000", "https://agent-aura.netlify.app"],
        credentials: true,
    }),
);
app.route("/auth", handleAuthRoutes(LogtoConfig));
export default app;
