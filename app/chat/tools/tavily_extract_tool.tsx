// 入参 {"urls":["https://example.com/article1", "https://example.com/article2"]}

import { createUITool } from "@langgraph-js/sdk";
import {
    ExternalLinkIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    FileText,
    AlertCircle,
} from "lucide-react";
import { FaviconDisplay } from "@/components/shared/FaviconDisplay";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TavilyExtractResult {
    url: string;
    raw_content: string;
}

interface TavilyExtractResponse {
    results: TavilyExtractResult[];
    failed_results: Array<{
        url: string;
        error: string;
    }>;
    response_time: number;
}

interface TavilyExtractInput {
    urls: string[];
    include_images?: boolean;
    extract_depth?: "basic" | "advanced";
}

export const tavily_extract_tool = createUITool({
    name: "tavily_extract",
    description:
        "Extract clean, readable content from web pages using Tavily AI. Removes ads, navigation, and boilerplate content to provide focused, high-quality text extraction. Perfect for content analysis, research, and data gathering from multiple web sources.",
    parameters: {
        urls: z.array(z.string()),
        include_images: z.boolean().optional(),
        extract_depth: z.enum(["basic", "advanced"]).optional(),
    },
    onlyRender: true,
    render(tool) {
        const [isExpanded, setIsExpanded] = useState(false);

        const data = tool.getInputRepaired();
        const response = tool.getJSONOutputSafe() as TavilyExtractResponse;
        const feedback: TavilyExtractResult[] = response?.results || [];
        const failedResults = response?.failed_results || [];

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

        const getContentStats = (content: string) => {
            const wordCount = content.split(/\s+/).length;
            const charCount = content.length;
            return { wordCount, charCount };
        };
        data.urls = data.urls || [];

        const canExpand = feedback.length > 0 || failedResults.length > 0;

        return (
            <div className="flex flex-col gap-2 my-2">
                {/* Header */}
                <div
                    className={cn(
                        "flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors",
                        canExpand && "cursor-pointer hover:bg-gray-50",
                    )}
                    onClick={() => canExpand && setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 w-8 h-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                                Tavily Extract
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                                {data.urls.length} URL
                                {data.urls.length !== 1 ? "s" : ""}
                                {data.extract_depth &&
                                    ` • ${data.extract_depth}`}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {tool.state === "loading" ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                                <span className="text-xs text-gray-400">
                                    Extracting...
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    {feedback.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-green-100 text-green-700 hover:bg-green-100 font-normal"
                                        >
                                            {feedback.length} success
                                        </Badge>
                                    )}
                                    {failedResults.length > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="bg-red-100 text-red-700 hover:bg-red-100 font-normal"
                                        >
                                            {failedResults.length} failed
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}
                        {canExpand &&
                            (isExpanded ? (
                                <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                            ))}
                    </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="grid gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* Successful Extractions */}
                        {feedback.map((result, index) => {
                            const stats = getContentStats(result.raw_content);
                            return (
                                <div
                                    key={`success-${index}`}
                                    className="group relative flex flex-col gap-2 p-3 bg-white border border-gray-100 rounded-2xl hover:border-green-300 transition-all"
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
                                                className="text-[10px] h-5 px-1.5 font-normal text-gray-500"
                                            >
                                                {stats.wordCount} words
                                            </Badge>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openLink(result.url);
                                            }}
                                            className="text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                                            title="Open source URL"
                                        >
                                            <ExternalLinkIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="bg-gray-50 rounded p-3 mt-1">
                                        <div className="prose prose-sm max-w-none text-gray-700 text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                                            {result.raw_content}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Failed Extractions */}
                        {failedResults.map((failed, index) => (
                            <div
                                key={`failed-${index}`}
                                className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-800"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium flex items-center gap-2">
                                        <FaviconDisplay
                                            url={failed.url}
                                            className="w-3 h-3"
                                        />
                                        <span className="truncate">
                                            {getDomainFromUrl(failed.url)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-red-600 truncate mt-0.5 opacity-80">
                                        Error: {failed.error}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    },
});
