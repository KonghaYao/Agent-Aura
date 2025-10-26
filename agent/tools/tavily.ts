import { TavilyExtract, TavilySearch } from "@langchain/tavily";
import { getEnv } from "../getEnv";
export const tavily_search = new TavilySearch({
    maxResults: 5,
    apiBaseUrl: getEnv("TAVILY_HOST"),
    tavilyApiKey: getEnv("TAVILY_API_KEY"),
});

export const tavily_extract = new TavilyExtract({
    apiBaseUrl: getEnv("TAVILY_HOST"),
    tavilyApiKey: getEnv("TAVILY_API_KEY"),
});
