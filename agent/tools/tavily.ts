import { TavilyExtract, TavilySearch } from "@langchain/tavily";
export const tavily_search = new TavilySearch({
    maxResults: 5,
    apiBaseUrl: import.meta.env.TAVILY_HOST,
    tavilyApiKey: import.meta.env.TAVILY_API_KEY,
});

export const tavily_extract = new TavilyExtract({
    apiBaseUrl: import.meta.env.TAVILY_HOST,
    tavilyApiKey: import.meta.env.TAVILY_API_KEY,
});
