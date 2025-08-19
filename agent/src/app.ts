import { Hono } from "hono";
import llmRouter from "./routes/llm";
import { app as SmithRouter } from "@langgraph-js/open-smith/dist/app";
const app = new Hono();
app.route("/llm", llmRouter);
app.route("/smith", SmithRouter);
export default app;
