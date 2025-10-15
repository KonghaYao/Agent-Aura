"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@langgraph-js/sdk/react";
import { getHistoryContent, formatTime } from "@langgraph-js/sdk";
import { History, RotateCcw, Trash2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const HistoryButton: React.FC = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const historyListRef = React.useRef<HTMLDivElement>(null);
    const activeItemRef = React.useRef<HTMLDivElement>(null);

    const {
        showHistory,
        historyList,
        currentChatId,
        createNewChat,
        deleteHistoryChat,
        toHistoryChat,
        refreshHistoryList,
        toggleHistoryVisible,
    } = useChat();

    // 当历史记录面板打开时，滚动到当前选中的对话
    React.useEffect(() => {
        if (showHistory && activeItemRef.current && historyListRef.current) {
            setTimeout(() => {
                activeItemRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 100);
        }
    }, [showHistory, currentChatId, historyList]);

    return (
        <Popover open={showHistory} onOpenChange={toggleHistoryVisible}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-gray-100"
                    title="历史记录"
                >
                    <History className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-96 p-0 max-h-[500px] overflow-hidden"
                align="start"
                side="top"
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-800">
                            历史记录
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsRefreshing(true);
                                refreshHistoryList().finally(() => {
                                    setIsRefreshing(false);
                                });
                            }}
                            className="h-8 w-8 p-0"
                            title="刷新历史记录"
                            disabled={isRefreshing}
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${
                                    isRefreshing ? "animate-spin" : ""
                                }`}
                            />
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
                        <div
                            className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer mb-3"
                            onClick={createNewChat}
                        >
                            <Plus className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-800">
                                新建对话
                            </span>
                        </div>

                        {historyList.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                {isRefreshing
                                    ? "正在加载历史记录..."
                                    : "暂无历史记录"}
                            </div>
                        ) : (
                            <div
                                ref={historyListRef}
                                className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-custom"
                            >
                                {historyList
                                    .sort(
                                        (a, b) =>
                                            new Date(b.created_at).getTime() -
                                            new Date(a.created_at).getTime(),
                                    )
                                    .map((thread) => (
                                        <div
                                            key={thread.thread_id}
                                            ref={
                                                thread.thread_id ===
                                                currentChatId
                                                    ? activeItemRef
                                                    : null
                                            }
                                            className={`flex justify-between items-center p-3 rounded-lg transition-colors duration-200 cursor-pointer ${
                                                thread.thread_id ===
                                                currentChatId
                                                    ? "bg-blue-50 border border-blue-200"
                                                    : "bg-gray-50 hover:bg-gray-100"
                                            }`}
                                            onClick={() =>
                                                toHistoryChat(thread)
                                            }
                                        >
                                            <div className="flex-1 min-w-0 mr-2">
                                                <div className="text-sm text-gray-800 mb-1 truncate max-w-[200px]">
                                                    {getHistoryContent(thread)}
                                                </div>
                                                <div className="flex gap-3 text-xs text-gray-500">
                                                    <span className="truncate max-w-[120px]">
                                                        {formatTime(
                                                            new Date(
                                                                thread.created_at,
                                                            ),
                                                        )}
                                                    </span>
                                                    <span className="truncate max-w-[60px]">
                                                        {thread.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button
                                                    className="p-1.5 rounded bg-green-100 hover:bg-green-200 transition-all duration-200 flex items-center justify-center hover:scale-110 group"
                                                    title="恢复对话"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toHistoryChat(thread);
                                                    }}
                                                >
                                                    <RotateCcw className="w-3 h-3 text-green-600 group-hover:text-green-700" />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded bg-red-100 hover:bg-red-200 transition-all duration-200 flex items-center justify-center hover:scale-110 group"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await deleteHistoryChat(
                                                            thread,
                                                        );
                                                        // 删除后手动刷新列表
                                                        refreshHistoryList();
                                                    }}
                                                    title="删除对话"
                                                >
                                                    <Trash2 className="w-3 h-3 text-red-600 group-hover:text-red-700" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default HistoryButton;
