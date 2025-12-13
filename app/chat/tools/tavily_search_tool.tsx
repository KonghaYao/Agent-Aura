// 入参 {"query":"Gemini Diffusion vs other diffusion models advantages disadvantages unique features"}

import { createUITool } from "@langgraph-js/sdk";
import {
    ExternalLinkIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Search,
} from "lucide-react";
import { FaviconDisplay } from "@/components/shared/FaviconDisplay";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
        "Advanced web search powered by Tavily AI. Provides high-quality, relevant search results with content snippets, relevance scoring, and fast response times.",
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

        const getRelevanceColor = (score: number) => {
            if (score >= 0.8)
                return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200";
            if (score >= 0.6)
                return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200";
            return "bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200";
        };

        return (
            <div className="flex flex-col gap-2 my-2">
                {/* Header */}
                <div
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <Search className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                                Tavily Search
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                                {data.query}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {tool.state === "loading" ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                <span className="text-xs text-gray-400">
                                    Searching...
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                                    {feedback.length} results
                                </span>
                                {feedback.length > 0 && (
                                    <div className="hidden sm:flex -space-x-1.5">
                                        {feedback
                                            .slice(0, 3)
                                            .map((result, i) => (
                                                <div
                                                    key={i}
                                                    className="relative z-10 rounded-full ring-2 ring-white bg-white"
                                                >
                                                    <FaviconDisplay
                                                        url={result.url}
                                                        className="w-5 h-5 rounded-full"
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                        {isExpanded ? (
                            <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                        )}
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && feedback.length > 0 && (
                    <div className="grid gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {feedback.map((result, index) => (
                            <div
                                key={index}
                                className="group relative flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-2xl hover:border-blue-300 transition-all"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <FaviconDisplay
                                            url={result.url}
                                            className="w-4 h-4 shrink-0 opacity-70"
                                        />
                                        <span className="text-xs text-gray-500 truncate">
                                            {getDomainFromUrl(result.url)}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "text-[10px] h-5 px-1.5 font-normal border",
                                                getRelevanceColor(result.score),
                                            )}
                                        >
                                            {(result.score * 100).toFixed(0)}%
                                            match
                                        </Badge>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openLink(result.url);
                                        }}
                                        className="text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Open in new tab"
                                    >
                                        <ExternalLinkIcon className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    <h3
                                        onClick={() => openLink(result.url)}
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline decoration-blue-200 underline-offset-2 line-clamp-1"
                                    >
                                        {result.title}
                                    </h3>
                                    <p className="text-xs leading-relaxed text-gray-600 line-clamp-3">
                                        {result.content}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    },
});
