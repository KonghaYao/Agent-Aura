import {
    handleExtractRequest,
    handleSearchRequest,
    handleFavicon,
} from "@langgraph-js/crawler";
import { Hono } from "hono";

const app = new Hono();

app.post("/website-to-md/extract", (c) => handleExtractRequest(c.req.raw));
app.post("/website-to-md/search", (c) => handleSearchRequest(c.req.raw));
app.post("/extract", (c) => handleExtractRequest(c.req.raw));
app.post("/search", (c) => handleSearchRequest(c.req.raw));
app.get("/favicon/:domain", (c) => handleFavicon(c.req.raw));
export default app;
