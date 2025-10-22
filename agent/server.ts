import "./index";
import { Hono } from "hono";
import LangGraphApp from "@langgraph-js/pure-graph/dist/adapter/hono/index";

const app = new Hono();

app.route("/", LangGraphApp);

export default app;
