"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessagesBox } from "./components/MessageBox";
import HistoryList from "./components/HistoryList";
import { ChatProvider, useChat } from "./context/ChatContext";
import {
    ExtraParamsProvider,
    useExtraParams,
} from "./context/ExtraParamsContext";
import { UsageMetadata } from "./components/UsageMetadata";
import { formatTime, Message } from "@langgraph-js/sdk";
import FileList from "./components/FileList";
import { ArtifactViewer } from "../artifacts/ArtifactViewer";
import "github-markdown-css/github-markdown.css";
import { ArtifactsProvider, useArtifacts } from "../artifacts/ArtifactsContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Send, StopCircle } from "lucide-react";

const ChatMessages: React.FC = () => {
    const {
        renderMessages,
        loading,
        inChatError,
        client,
        collapsedTools,
        toggleToolCollapse,
        isFELocking,
    } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const MessageContainer = useRef<HTMLDivElement>(null);

    // 检查是否足够接近底部（距离底部 30% 以内）
    const isNearBottom = () => {
        if (!MessageContainer.current) return false;

        const container = MessageContainer.current;
        const scrollPosition = container.scrollTop + container.clientHeight;
        const scrollHeight = container.scrollHeight;

        // 当距离底部不超过容器高度的 30% 时，认为足够接近底部
        return scrollHeight - scrollPosition <= container.clientHeight * 0.3;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (renderMessages.length > 0 && MessageContainer.current) {
            // 切换消息时，自动滚动到底部
            if (!loading) {
                scrollToBottom();
            }
            // 只有当用户已经滚动到接近底部时，才自动滚动到底部
            if (loading && isNearBottom()) {
                scrollToBottom();
            }
        }
    }, [renderMessages]);

    return (
        <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 w-full"
            ref={MessageContainer}>
            <MessagesBox
                renderMessages={renderMessages}
                collapsedTools={collapsedTools}
                toggleToolCollapse={toggleToolCollapse}
                client={client!}
            />
            <div className="flex items-center justify-center py-4 text-gray-500 h-10">
                {loading && !isFELocking() && (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                        正在思考中...
                    </>
                )}
            </div>
            {inChatError && (
                <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                    {JSON.stringify(inChatError)}
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
};

const ChatInput: React.FC = () => {
    const {
        userInput,
        setUserInput,
        loading,
        sendMessage,
        stopGeneration,
        currentAgent,
        setCurrentAgent,
        client,
    } = useChat();
    const { extraParams } = useExtraParams();
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const handleFileUploaded = (url: string) => {
        setImageUrls((prev) => [...prev, url]);
    };
    const _setCurrentAgent = (agent: string) => {
        localStorage.setItem("agent_name", agent);
        setCurrentAgent(agent);
    };
    const sendMultiModalMessage = () => {
        const content: Message[] = [
            {
                type: "human",
                content: [
                    {
                        type: "text",
                        text: userInput,
                    },
                    ...imageUrls.map((url) => ({
                        type: "image_url" as const,
                        image_url: { url },
                    })),
                ],
            },
        ];

        sendMessage(content, {
            extraParams,
        });

        // 清空图片列表
        setImageUrls([]);
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMultiModalMessage();
        }
    };

    return (
        <div
            className={cn(
                "w-full border border-gray-200 p-2 rounded-xl sticky bottom-8 bg-white z-10 shadow-xl"
            )}>
            {imageUrls.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <FileList onFileUploaded={handleFileUploaded} />
                </div>
            )}
            <Textarea
                className="flex-1 resize-none border-0 shadow-none  p-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                rows={1}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="你好，我是Aura，有什么可以帮你的吗？"
                disabled={loading}
            />
            <div className="flex items-center gap-2 p-2">
                <Select value={currentAgent} onValueChange={_setCurrentAgent}>
                    <SelectTrigger className="w-[180px] border-0 bg-transparent hover:bg-gray-100 transition-colors rounded-md">
                        <SelectValue placeholder="选择一个 Agent" />
                    </SelectTrigger>
                    <SelectContent>
                        {client?.availableAssistants.map((i) => {
                            return (
                                <SelectItem value={i.graph_id} key={i.graph_id}>
                                    {i.name}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                {client?.tokenCounter?.output_tokens! > 0 && (
                    <UsageMetadata
                        usage_metadata={client?.tokenCounter || {}}
                    />
                )}
                <div className="flex-1"></div>
                <Button
                    onClick={() =>
                        loading ? stopGeneration() : sendMultiModalMessage()
                    }
                    disabled={
                        !loading && !userInput.trim() && imageUrls.length === 0
                    }
                    variant={loading ? "destructive" : "default"}
                    size="icon"
                    className="rounded-full">
                    {loading ? (
                        <StopCircle className="h-5 w-5" />
                    ) : (
                        <Send className="h-5 w-5 " />
                    )}
                </Button>
            </div>
        </div>
    );
};

const Chat: React.FC = () => {
    const { showHistory, toggleHistoryVisible, renderMessages } = useChat();
    const { showArtifact } = useArtifacts();

    // 监听来自 sidebar 的事件
    React.useEffect(() => {
        const handleToggleHistory = () => {
            toggleHistoryVisible();
        };

        window.addEventListener("toggleHistory", handleToggleHistory);
        return () => {
            window.removeEventListener("toggleHistory", handleToggleHistory);
        };
    }, [toggleHistoryVisible]);

    const hasMessages = renderMessages.length > 0;

    return (
        <div className="flex h-full w-full justify-center overflow-hidden">
            {showHistory && (
                <HistoryList
                    onClose={() => toggleHistoryVisible()}
                    formatTime={formatTime}
                />
            )}
            <div className="flex-1 flex flex-col h-full overflow-auto">
                <div className="flex-1 flex flex-col items-center justify-center mb-8 w-4xl mx-auto">
                    {hasMessages ? (
                        <ChatMessages />
                    ) : (
                        <h1 className="text-4xl font-bold mb-24 text-center">
                            <span className="text-4xl pr-2">👋</span>
                            你好，我是 Aura
                        </h1>
                    )}
                    <ChatInput />
                </div>
            </div>

            {showArtifact && (
                <div className="overflow-hidden flex-1">
                    <ArtifactViewer />
                </div>
            )}
        </div>
    );
};

const ChatWrapper: React.FC = () => {
    return (
        <ChatProvider>
            <ExtraParamsProvider>
                <ArtifactsProvider>
                    <Chat />
                </ArtifactsProvider>
            </ExtraParamsProvider>
        </ChatProvider>
    );
};

export default ChatWrapper;
