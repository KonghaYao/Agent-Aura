"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSelectionPrompt } from "@/context/SelectionPromptContext";
import { ChatResponse } from "@/hooks/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Copy, X, Sparkles } from "lucide-react";

export function SelectionPromptDialog() {
    const { state, hideDialog, setLoading, setResponse, clearResponse } =
        useSelectionPrompt();
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const responseRef = useRef<HTMLDivElement>(null);

    // 当弹窗打开时，自动聚焦到输入框
    useEffect(() => {
        if (state.isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [state.isOpen]);

    // 自动滚动到响应底部
    useEffect(() => {
        if (responseRef.current) {
            responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
    }, [state.response]);

    const handleSubmit = async () => {
        if (!inputValue.trim() || state.isLoading) return;

        setLoading(true);
        clearResponse();

        try {
            const chatResponse = new ChatResponse(
                "gpt-4o-mini",
                import.meta.env.NEXT_PUBLIC_LANGGRAPH_API_URL!,
                {
                    defaultHeader: {
                        "Content-Type": "application/json",
                        Authorization:
                            `Bearer ` + localStorage.getItem("token"),
                    },
                },
            );
            const fullPrompt = `请基于以下选中的文本内容回答问题：

选中的文本：
${state.selectedText}

用户问题：
${inputValue.trim()}

请提供详细、准确的回答。`;

            let accumulatedResponse = "";
            for await (const chunk of chatResponse.response(fullPrompt)) {
                accumulatedResponse += chunk;
                setResponse(accumulatedResponse);
            }
        } catch (error) {
            console.error("大模型调用失败:", error);
            setResponse("抱歉，处理请求时出现了错误，请稍后重试。");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === "Escape") {
            handleClose();
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error("复制失败:", error);
        }
    };

    const handleClose = () => {
        setInputValue("");
        hideDialog();
    };

    if (!state.isOpen) return null;

    return (
        <div
            className="fixed z-50 max-w-md"
            style={{
                left: state.position?.x || 0,
                top: state.position?.y || 0,
            }}
        >
            <Card className="shadow-xl border-2 border-gray-200 bg-white">
                <CardContent className="p-4">
                    {/* 标题栏 */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700">
                                AI 助手
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* 选中文本显示 */}
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-blue-700 font-medium">
                                选中文本
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    copyToClipboard(state.selectedText)
                                }
                                className="h-4 w-4 p-0 text-blue-600 hover:text-blue-700"
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                        <p className="text-gray-600 line-clamp-2 max-h-12 overflow-hidden">
                            "{state.selectedText}"
                        </p>
                    </div>

                    {/* 输入框 */}
                    <div className="flex gap-2 mb-3">
                        <Input
                            ref={inputRef}
                            placeholder="问个问题..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="text-sm"
                            disabled={state.isLoading}
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={!inputValue.trim() || state.isLoading}
                            size="sm"
                            className="px-3"
                        >
                            {state.isLoading ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="h-3 w-3" />
                            )}
                        </Button>
                    </div>

                    {/* AI回复区域 */}
                    {state.response && (
                        <div className="border-t pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-700">
                                    AI 回复
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        copyToClipboard(state.response)
                                    }
                                    className="h-4 w-4 p-0 text-gray-600 hover:text-gray-700"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                            <div
                                ref={responseRef}
                                className="bg-gray-50 border rounded p-2 text-xs leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap"
                            >
                                {state.response}
                                {state.isLoading && (
                                    <span className="inline-block w-1 h-3 bg-blue-500 animate-pulse ml-1" />
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
