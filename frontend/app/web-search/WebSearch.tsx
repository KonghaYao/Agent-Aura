"use client";

import { useState } from "react";
import { Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { UrlMarkdownPreview } from "../artifacts/components/UrlMarkdownPreview";
import { Artifact } from "../artifacts/ArtifactsContext";
import "../markdown.css";
interface SearchResult {
    title: string;
    url: string;
    description: string;
    updateTime: string;
    metadata?: Record<string, any>;
}

export default function WebSearchWrapper() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEngine, setSelectedEngine] = useState<string>("bing");

    const availableEngines = [
        { value: "bing", label: "Bing" },
        { value: "basic", label: "Basic" },
        { value: "npm", label: "NPM" },
        { value: "juejin", label: "掘金" },
        { value: "anthropic", label: "Anthropic" },
        { value: "github", label: "GitHub" },
    ];

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query: searchQuery,
                    engines: [selectedEngine],
                    returnType: "json",
                    withMetadata: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`搜索请求失败: ${response.status}`);
            }

            const data = await response.json();
            const engineResults = data.find(
                (item: { engine: string; results: SearchResult[] }) =>
                    item.engine === selectedEngine,
            );

            if (engineResults) {
                setSearchResults(engineResults.results);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error("搜索失败:", error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleResultClick = (url: string) => {
        setSelectedUrl(url);
    };

    // 创建用于 UrlMarkdownPreview 的 artifact
    const createArtifact = (url: string): Artifact => ({
        id: "preview",
        code: url,
        filename: "url-preview",
        filetype: "url",
        version: 1,
    });

    return (
        <div className="flex h-full">
            {/* 左侧搜索面板 */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
                {/* 搜索框区域 */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex gap-2">
                        <Input
                            placeholder="输入搜索关键词..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="flex-1"
                        />
                        <Select
                            value={selectedEngine}
                            onValueChange={(value) => setSelectedEngine(value)}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="选择引擎" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableEngines.map((engine) => (
                                    <SelectItem
                                        key={engine.value}
                                        value={engine.value}
                                    >
                                        {engine.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            onClick={handleSearch}
                            disabled={isLoading}
                            size="sm"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* 搜索结果列表 */}
                <div className="flex-1 overflow-auto p-4">
                    {isLoading && (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">
                                搜索中...
                            </p>
                        </div>
                    )}

                    {!isLoading &&
                        searchResults.length === 0 &&
                        searchQuery && (
                            <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">
                                    暂无搜索结果
                                </p>
                            </div>
                        )}

                    {!isLoading &&
                        searchResults.length === 0 &&
                        !searchQuery && (
                            <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">
                                    输入关键词开始搜索
                                </p>
                            </div>
                        )}

                    <div className="space-y-3">
                        {searchResults.map((result, index) => (
                            <Card
                                key={`${result.url}-${index}`}
                                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                                    selectedUrl === result.url
                                        ? "border-blue-500 bg-blue-50"
                                        : ""
                                }`}
                                onClick={() => handleResultClick(result.url)}
                            >
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center mb-1">
                                                <img
                                                    src={`https://favicone.com/${
                                                        new URL(result.url)
                                                            .hostname
                                                    }?s=16`}
                                                    alt="favicon"
                                                    className="w-4 h-4 mr-2 rounded-sm"
                                                />
                                                <h3 className="font-medium text-sm leading-tight truncate">
                                                    {result.title}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                                {result.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs">
                                                <p className="text-blue-600 truncate flex-1 mr-2">
                                                    {result.url}
                                                </p>
                                                {result.updateTime && (
                                                    <p className="text-muted-foreground whitespace-nowrap">
                                                        {result.updateTime}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* 右侧预览面板 */}
            <div className="flex-1 flex flex-col">
                {selectedUrl ? (
                    <UrlMarkdownPreview
                        currentArtifact={createArtifact(selectedUrl)}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-muted-foreground">
                                选择左侧搜索结果查看预览
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
