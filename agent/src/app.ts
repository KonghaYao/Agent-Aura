import { Hono } from "hono";
import memoryRouter from "./memory/routes";
import { handleAuthRoutes, type LogtoHonoConfig } from "./routes/auth/auth";
import { LogtoConfig } from "./config";

const app = new Hono();
app.route("/memory", memoryRouter);
app.route("/auth", handleAuthRoutes(LogtoConfig));
export default app;
