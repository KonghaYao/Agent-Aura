// 入参 {"urls":["https://example.com/article1", "https://example.com/article2"]}

import { createUITool } from "@langgraph-js/sdk";
import {
    ExternalLinkIcon,
    FileTextIcon,
    GlobeIcon,
    ChevronDownIcon,
    ChevronUpIcon,
} from "lucide-react";
import { FaviconDisplay } from "@/components/shared/FaviconDisplay";
import { Source, SourceTrigger, SourceContent } from "@/components/ui/source";
import { z } from "zod";
import { useState } from "react";

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

        const data = tool.getInputRepaired() as TavilyExtractInput;
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

        const truncateContent = (
            content: string,
            maxLength: number = 300,
        ): string => {
            if (content.length <= maxLength) return content;
            return content.substring(0, maxLength).trim() + "...";
        };

        const getContentStats = (content: string) => {
            const wordCount = content.split(/\s+/).length;
            const charCount = content.length;
            return { wordCount, charCount };
        };

        return (
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        Tavily Extract: {data.urls.length} URL
                        {data.urls.length > 1 ? "s" : ""}
                        {data.extract_depth &&
                            ` • Depth: ${data.extract_depth}`}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                        <span>Content Extraction</span>
                        <FileTextIcon className="w-3 h-3" />
                    </div>
                </div>

                {tool.state === "loading" && (
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        Extracting content from {data.urls.length} URL
                        {data.urls.length > 1 ? "s" : ""}...
                    </div>
                )}

                {(feedback.length > 0 || failedResults.length > 0) && (
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Successfully extracted: {feedback.length}
                            {failedResults.length > 0 &&
                                ` • Failed: ${failedResults.length}`}
                        </div>
                        {feedback.length > 0 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-2 px-3 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-md transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronUpIcon className="w-3 h-3" />
                                ) : (
                                    <ChevronDownIcon className="w-3 h-3" />
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Collapsed/Tag View */}
                {!isExpanded && feedback.length > 0 && (
                    <div className="overflow-x-auto py-2">
                        <div className="flex gap-2 min-w-max">
                            {feedback.map((result, index) => {
                                const stats = getContentStats(
                                    result.raw_content,
                                );
                                return (
                                    <Source key={index} href={result.url}>
                                        <SourceTrigger
                                            showFavicon
                                            className="bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 px-3 py-2 rounded-full"
                                        />
                                        <SourceContent
                                            title={`${getDomainFromUrl(
                                                result.url,
                                            )} - ${stats.wordCount} words`}
                                            description={`${
                                                stats.wordCount
                                            } words, ${
                                                stats.charCount
                                            } characters extracted from ${getDomainFromUrl(
                                                result.url,
                                            )}`}
                                        />
                                    </Source>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Failed Extractions in Collapsed View */}
                {!isExpanded && failedResults.length > 0 && (
                    <div className="overflow-x-auto py-2">
                        <div className="flex gap-2 min-w-max">
                            {failedResults.map((failed, index) => (
                                <div
                                    key={index}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs bg-red-50 border-red-200 text-red-700 whitespace-nowrap"
                                    title={`${getDomainFromUrl(
                                        failed.url,
                                    )} - Error: ${failed.error}`}
                                >
                                    <FaviconDisplay
                                        url={failed.url}
                                        className="w-3 h-3 flex-shrink-0"
                                    />
                                    <span className="truncate max-w-[120px]">
                                        {getDomainFromUrl(failed.url)}
                                    </span>
                                    <span className="font-medium">Failed</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expanded/Detailed View */}
                {isExpanded && (
                    <>
                        {/* Successful Extractions */}
                        <div className="max-h-[400px] overflow-y-auto space-y-3">
                            {feedback.map((result, index) => {
                                const stats = getContentStats(
                                    result.raw_content,
                                );
                                return (
                                    <div
                                        key={index}
                                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                {/* URL Header */}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FaviconDisplay
                                                        url={result.url}
                                                        className="flex-shrink-0"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3
                                                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer truncate text-sm flex items-center gap-1"
                                                            onClick={() =>
                                                                openLink(
                                                                    result.url,
                                                                )
                                                            }
                                                            title={result.url}
                                                        >
                                                            <GlobeIcon className="w-4 h-4 flex-shrink-0" />
                                                            {getDomainFromUrl(
                                                                result.url,
                                                            )}
                                                        </h3>
                                                        <div className="text-xs text-gray-500 truncate">
                                                            {result.url}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content Stats */}
                                                <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                                                    <span>
                                                        {stats.wordCount} words
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {stats.charCount}{" "}
                                                        characters
                                                    </span>
                                                </div>

                                                {/* Content Preview */}
                                                <div className="bg-gray-50 rounded-md p-3">
                                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                        {truncateContent(
                                                            result.raw_content,
                                                        )}
                                                    </p>
                                                    {result.raw_content.length >
                                                        300 && (
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            ... (
                                                            {result.raw_content
                                                                .length -
                                                                300}{" "}
                                                            more characters)
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                onClick={() =>
                                                    openLink(result.url)
                                                }
                                                className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Open source URL"
                                            >
                                                <ExternalLinkIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Failed Extractions */}
                        {failedResults.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-red-600">
                                    Failed Extractions ({failedResults.length})
                                </div>
                                <div className="space-y-1">
                                    {failedResults.map((failed, index) => (
                                        <div
                                            key={index}
                                            className="bg-red-50 border border-red-200 rounded-md p-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FaviconDisplay
                                                    url={failed.url}
                                                    className="flex-shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-red-800 truncate">
                                                        {getDomainFromUrl(
                                                            failed.url,
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-red-600 truncate">
                                                        {failed.url}
                                                    </div>
                                                    <div className="text-xs text-red-500 mt-1">
                                                        Error: {failed.error}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {feedback.length === 0 &&
                    failedResults.length === 0 &&
                    tool.state !== "loading" && (
                        <div className="text-center py-8 text-gray-500">
                            <FileTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <div className="text-sm">No content extracted</div>
                            <div className="text-xs mt-1">
                                Check the URLs and try again
                            </div>
                        </div>
                    )}
            </div>
        );
    },
});
