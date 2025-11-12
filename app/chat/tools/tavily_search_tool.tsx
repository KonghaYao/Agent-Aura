// 入参 {"query":"Gemini Diffusion vs other diffusion models advantages disadvantages unique features"}

import { createUITool } from "@langgraph-js/sdk";
import {
    LinkIcon,
    ExternalLinkIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "lucide-react";
import { FaviconDisplay } from "@/components/shared/FaviconDisplay";
import { Source, SourceTrigger, SourceContent } from "@/components/ui/source";
import { z } from "zod";
import { useState } from "react";

interface TavilySearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

interface TavilyResponse {
    query: string;
    results: TavilySearchResult[];
    response_time: number;
}

interface TavilySearchInput {
    query: string;
    max_results?: number;
    include_domains?: string[];
    exclude_domains?: string[];
}

export const tavily_search_tool = createUITool({
    name: "tavily_search",
    description:
        "Advanced web search powered by Tavily AI. Provides high-quality, relevant search results with content snippets, relevance scoring, and fast response times. Perfect for research, fact-checking, and gathering current information from the web.",
    parameters: {
        query: z.string(),
        max_results: z.number().optional(),
        include_domains: z.array(z.string()).optional(),
        exclude_domains: z.array(z.string()).optional(),
    },
    onlyRender: true,
    render(tool) {
        const [isExpanded, setIsExpanded] = useState(false);

        const data = tool.getInputRepaired() as TavilySearchInput;
        const feedback: TavilySearchResult[] =
            (tool.getJSONOutputSafe() as TavilyResponse)?.results || [];

        const openLink = (url: string) => {
            window.open(url, "_blank", "noopener,noreferrer");
        };

        const getDomainFromUrl = (url: string): string => {
            try {
                return new URL(url).hostname.replace("www.", "");
            } catch {
                return url;
            }
        };

        const getRelevanceColor = (score: number): string => {
            if (score >= 0.8) return "text-green-600";
            if (score >= 0.6) return "text-yellow-600";
            return "text-gray-600";
        };

        return (
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Tavily Search: {data.query}
                        {data.max_results &&
                            ` • Max results: ${data.max_results}`}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                        <span>Powered by Tavily AI</span>
                        <ExternalLinkIcon className="w-3 h-3" />
                    </div>
                </div>

                {tool.state === "loading" && (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Searching with Tavily AI...
                    </div>
                )}

                {feedback.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Found {feedback.length} relevant results
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronUpIcon className="w-3 h-3" />
                            ) : (
                                <ChevronDownIcon className="w-3 h-3" />
                            )}
                        </button>
                    </div>
                )}

                {/* Collapsed/Tag View */}
                {!isExpanded && feedback.length > 0 && (
                    <div className="overflow-x-auto py-2">
                        <div className="flex gap-2 min-w-max">
                            {feedback.map((result, index) => (
                                <Source key={index} href={result.url}>
                                    <SourceTrigger
                                        label={result.title}
                                        showFavicon
                                        className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-full"
                                    />
                                    <SourceContent
                                        title={`${result.title} - ${(
                                            result.score * 100
                                        ).toFixed(0)}% relevance`}
                                        description={`${getDomainFromUrl(
                                            result.url,
                                        )} • ${result.content.substring(
                                            0,
                                            100,
                                        )}...`}
                                    />
                                </Source>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expanded/Detailed View */}
                {isExpanded && (
                    <div className="max-h-[400px] overflow-y-auto space-y-3">
                        {feedback.map((result, index) => (
                            <div
                                key={index}
                                className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {/* Title and URL */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaviconDisplay
                                                url={result.url}
                                                className="flex-shrink-0"
                                            />
                                            <h3
                                                className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer truncate text-sm"
                                                onClick={() =>
                                                    openLink(result.url)
                                                }
                                                title={result.title}
                                            >
                                                {result.title}
                                            </h3>
                                        </div>

                                        {/* Domain and Score */}
                                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                            <span className="truncate">
                                                {getDomainFromUrl(result.url)}
                                            </span>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <span>Relevance:</span>
                                                <span
                                                    className={`font-medium ${getRelevanceColor(
                                                        result.score,
                                                    )}`}
                                                >
                                                    {(
                                                        result.score * 100
                                                    ).toFixed(0)}
                                                    %
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Snippet */}
                                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                            {result.content}
                                        </p>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={() => openLink(result.url)}
                                        className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Open in new tab"
                                    >
                                        <ExternalLinkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {feedback.length === 0 && tool.state !== "loading" && (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-sm">No search results found</div>
                        <div className="text-xs mt-1">
                            Try adjusting your search query
                        </div>
                    </div>
                )}
            </div>
        );
    },
});
