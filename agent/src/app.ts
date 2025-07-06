import { Hono } from "hono";
import llmRouter from "./routes/llm";
const app = new Hono();
app.route("/llm", llmRouter);

export default app;
