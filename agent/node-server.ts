import app from "./raw-server";
import { serve } from "@hono/node-server";

serve({
    fetch: app.fetch,
    port: 8123,
});
