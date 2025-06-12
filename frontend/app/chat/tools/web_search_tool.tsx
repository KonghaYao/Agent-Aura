// 入参 {"query":"Gemini Diffusion vs other diffusion models advantages disadvantages unique features"}

import { createToolUI, ToolRenderData } from "@langgraph-js/sdk";
import { ChevronDownIcon, LinkIcon } from "lucide-react";
import { useState } from "react";

interface SearchResult {
    title: string;
    url: string;
    description: string;
    updateTime: string;
    metadata: {
        engines: string[];
    };
}

interface RenderResponse {
    engine: string;
    results: SearchResult[];
}

interface SearchInput {
    query: string;
}

export const web_search_tool = createToolUI({
    name: "web_search",
    description:
        "A powerful web search tool that provides comprehensive, real-time results using search engine. Returns relevant web content with customizable parameters for result count, content type, and domain filtering. Ideal for gathering current information, news, and detailed web content analysis.",
    parameters: [],
    onlyRender: true,
    render(tool: ToolRenderData<SearchInput, RenderResponse[]>) {
        const data = tool.getInputRepaired();
        const feedback =
            tool.getJSONOutputSafe()?.flatMap((i) => i.results) || [];

        const openLink = (url: string) => {
            window.open(url, "_blank", "noopener,noreferrer");
        };

        return (
            <div className="p-4 space-y-4">
                <div className="text-sm text-gray-500">
                    Search Query: {data.query}；Get {feedback.length} results
                </div>
                {tool.state === "loading" && (
                    <div className="text-sm text-gray-500">
                        Searching for you...
                    </div>
                )}
                <div className="py-3 pl-3 max-h-[300px] overflow-y-auto bg-white border rounded-2xl">
                    {feedback.map((result, index) => (
                        <div key={index} className="p-2">
                            <div className="flex items-center justify-between select-none cursor-pointer">
                                <span className="font-xs flex-1">
                                    {result.title}
                                </span>
                                {/* <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openLink(result.url);
                                    }}
                                    className="px-3 py-1 text-sm"
                                >
                                    <LinkIcon className="w-4 h-4" />
                                </div> */}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>
                                        {new Date(
                                            result.updateTime,
                                        ).toLocaleDateString()}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {result.metadata.engines.join(", ")}
                                    </span>
                                    <span>•</span>
                                    <span className="text-gray-400">
                                        <LinkIcon
                                            className="w-4 h-4"
                                            onClick={() => {
                                                openLink(result.url);
                                            }}
                                        ></LinkIcon>
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                <p className="text-sm text-gray-600">
                                    {result.description}
                                </p>
                            </div>
                            {index < feedback.length - 1 && (
                                <div className="border-t border-gray-200 my-2"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    },
});
