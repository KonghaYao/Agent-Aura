import {
    handleExtractRequest,
    handleSearchRequest,
} from "@langgraph-js/crawler";
import { Hono } from "hono";

const app = new Hono();

app.post("/website-to-md/extract", (c) => handleExtractRequest(c.req.raw));
app.post("/website-to-md/search", (c) => handleSearchRequest(c.req.raw));
export default app;
