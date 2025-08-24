import { TavilySearch, TavilyCrawl } from "@langchain/tavily";

export const tavilySearchTool = new TavilySearch({
    maxResults: 5,
});
export const tavilyCrawlTool = new TavilyCrawl({});
