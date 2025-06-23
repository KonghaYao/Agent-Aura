import { Hono } from "hono";
import memoryRouter from "./memory/routes";
const app = new Hono();
app.route("/memory", memoryRouter);
export default app;
