import app from "@/agent/server";
import type { APIRoute } from "astro";
export const prerender = false;
export const ALL: APIRoute = (context) => app.fetch(context.request);
