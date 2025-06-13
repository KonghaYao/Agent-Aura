"use client";

import React, { useState, useRef, useEffect, memo } from "react";
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
import "../markdown.css";
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
import { Brain, Send, StopCircle } from "lucide-react";
import { models } from "./config/models";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import AnimatedBackground from "../components/AnimatedBackground";
import FileDropzone from "./components/FileDropzone";
import { defaultUploader } from "./services/uploaders";

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
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 w-full pt-12"
            ref={MessageContainer}
        >
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
        setCurrentAgent,
        client,
    } = useChat();
    const { extraParams, setExtraParams } = useExtraParams();
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const handleFileUploaded = (url: string) => {
        setImageUrls((prev) => [...prev, url]);
    };

    // 移除图片
    const removeImage = (index: number) => {
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    // 监听来自FileDropzone的文件上传成功事件
    useEffect(() => {
        const handleFileUploadedEvent = (event: Event) => {
            const customEvent = event as CustomEvent<{ url: string }>;
            handleFileUploaded(customEvent.detail.url);
        };

        window.addEventListener("fileUploaded", handleFileUploadedEvent);
        return () => {
            window.removeEventListener("fileUploaded", handleFileUploadedEvent);
        };
    }, []);

    const _setCurrentAgent = (agent: string) => {
        localStorage.setItem("agent_name", agent);
        setCurrentAgent(agent);
    };

    const sendMultiModalMessage = () => {
        if (userInput.trim() === "" && imageUrls.length === 0) {
            return;
        }
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

        // 清空输入和图片列表
        // setUserInput("");
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
                "w-full border border-gray-200 p-2 rounded-xl bg-white z-10 shadow-xl",
            )}
        >
            {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 border-b border-gray-200">
                    {imageUrls.map((url, index) => (
                        <div
                            key={index}
                            className="relative w-20 h-20 rounded-lg overflow-hidden"
                        >
                            <img
                                src={url}
                                alt={`上传图片 ${index + 1}`}
                                className="w-full h-full object-cover border border-gray-200"
                            />
                            <button
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-base leading-none hover:bg-black/70 transition-colors"
                                onClick={() => removeImage(index)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <label className="inline-flex items-center justify-center w-20 h-20 text-gray-500 bg-gray-100 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-200">
                        <svg
                            viewBox="0 0 24 24"
                            width="32"
                            height="32"
                            fill="currentColor"
                        >
                            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                            <path d="M20 4h-3.17l-1.24-1.35A1.99 1.99 0 0 0 14.12 2H9.88c-.56 0-1.1.24-1.48.65L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                        </svg>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                                const selectedFiles = Array.from(
                                    e.target.files || [],
                                );
                                const imageFiles = selectedFiles.filter(
                                    (file) => file.type.startsWith("image/"),
                                );

                                for (const file of imageFiles) {
                                    try {
                                        const formData = new FormData();
                                        formData.append("file", file);

                                        const response = await fetch(
                                            "https://tmpfiles.org/api/v1/upload",
                                            {
                                                method: "POST",
                                                body: formData,
                                            },
                                        );

                                        if (response.ok) {
                                            const data = await response.json();
                                            if (
                                                data &&
                                                data.data &&
                                                data.data.url
                                            ) {
                                                const fileId = data.data.url
                                                    .split("/")
                                                    .pop();
                                                const url = `https://tmpfiles.org/dl/${fileId}`;
                                                handleFileUploaded(url);
                                            }
                                        }
                                    } catch (error) {
                                        console.error("Upload failed:", error);
                                    }
                                }

                                e.target.value = "";
                            }}
                            className="hidden"
                        />
                    </label>
                </div>
            )}
            <Textarea
                className="flex-1 max-h-24 resize-none border-0 shadow-none  p-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                rows={1}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="你好，我是Aura，有什么可以帮你的吗？"
                disabled={loading}
            />
            <div className="flex items-center gap-2 p-2">
                <Select
                    value={extraParams.main_model || "gpt-4.1-mini"}
                    onValueChange={(value) => {
                        setExtraParams({ ...extraParams, main_model: value });
                    }}
                >
                    <SelectTrigger className="w-fit border-none bg-transparent hover:bg-gray-100 transition-colors rounded-md">
                        <Brain></Brain>
                        <SelectValue placeholder="选择一个模型" />
                    </SelectTrigger>
                    <SelectContent>
                        {models.main_model.map((i) => {
                            return (
                                <SelectItem value={i} key={i}>
                                    {i}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                {/* <Select value={currentAgent} onValueChange={_setCurrentAgent}>
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
                </Select> */}
                {client?.tokenCounter?.output_tokens! > 0 && (
                    <UsageMetadata
                        usage_metadata={client?.tokenCounter || {}}
                    />
                )}
                <div className="flex-1"></div>
                {imageUrls.length === 0 && (
                    <label className="w-8 h-8 flex items-center justify-center text-gray-500 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
                        <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="currentColor"
                        >
                            <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                            <path d="M20 4h-3.17l-1.24-1.35A1.99 1.99 0 0 0 14.12 2H9.88c-.56 0-1.1.24-1.48.65L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                        </svg>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                                const selectedFiles = Array.from(
                                    e.target.files || [],
                                );
                                const imageFiles = selectedFiles.filter(
                                    (file) => file.type.startsWith("image/"),
                                );

                                for (const file of imageFiles) {
                                    try {
                                        const formData = new FormData();
                                        formData.append("file", file);

                                        const response = await fetch(
                                            "https://tmpfiles.org/api/v1/upload",
                                            {
                                                method: "POST",
                                                body: formData,
                                            },
                                        );

                                        if (response.ok) {
                                            const data = await response.json();
                                            if (
                                                data &&
                                                data.data &&
                                                data.data.url
                                            ) {
                                                const fileId = data.data.url
                                                    .split("/")
                                                    .pop();
                                                const url = `https://tmpfiles.org/dl/${fileId}`;
                                                handleFileUploaded(url);
                                            }
                                        }
                                    } catch (error) {
                                        console.error("Upload failed:", error);
                                    }
                                }

                                e.target.value = "";
                            }}
                            className="hidden"
                        />
                    </label>
                )}
                <Button
                    onClick={() =>
                        loading ? stopGeneration() : sendMultiModalMessage()
                    }
                    disabled={
                        !loading && !userInput.trim() && imageUrls.length === 0
                    }
                    variant={loading ? "destructive" : "default"}
                    size="icon"
                    className="rounded-full"
                >
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

// 使用memo来记忆ChatContainer组件，避免不必要的重新渲染
const ChatContainer = memo(({ hasMessages }: { hasMessages: boolean }) => {
    const { renderMessages } = useChat();

    return (
        <div className="flex-1 flex flex-col h-full overflow-auto hide-scrollbar">
            <div className="flex-1 flex flex-col items-center justify-center mb-8 w-full max-w-4xl mx-auto">
                {hasMessages ? (
                    <ChatMessages />
                ) : (
                    <h1 className="text-4xl font-bold mb-24 text-center">
                        <span className="text-4xl pr-2">👋</span>
                        你好，我是 Aura
                    </h1>
                )}
                <div className="px-4 w-full sticky bottom-8 ">
                    <ChatInput />
                </div>
            </div>
        </div>
    );
});
ChatContainer.displayName = "ChatContainer";

const Chat: React.FC = () => {
    const { showHistory, toggleHistoryVisible, renderMessages } = useChat();
    const { showArtifact } = useArtifacts();
    const [panelSizes, setPanelSizes] = useState({
        chat: 50,
        artifact: 50,
    });

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

    // 处理面板大小变化
    const handleResize = (sizes: number[]) => {
        setPanelSizes({
            chat: sizes[0],
            artifact: sizes[1] || panelSizes.artifact,
        });
    };

    return (
        <FileDropzone
            uploader={defaultUploader}
            onFileUploaded={(url) => {
                // 通过自定义事件将上传的URL传递给ChatInput组件
                const event = new CustomEvent("fileUploaded", {
                    detail: { url },
                });
                window.dispatchEvent(event);
            }}
        >
            <div className="flex h-full w-full justify-center overflow-hidden">
                {showHistory && (
                    <HistoryList
                        onClose={() => toggleHistoryVisible()}
                        formatTime={formatTime}
                    />
                )}
                <ResizablePanelGroup
                    direction="horizontal"
                    className="w-full h-full"
                    onLayout={handleResize}
                >
                    <ResizablePanel
                        defaultSize={showArtifact ? panelSizes.chat : 100}
                        minSize={30}
                    >
                        <ChatContainer hasMessages={hasMessages} />
                    </ResizablePanel>

                    {/* 始终渲染Handle和第二个面板，但在不显示时隐藏它们 */}
                    <div className={showArtifact ? "block" : "hidden"}>
                        <ResizableHandle withHandle />
                    </div>

                    <ResizablePanel
                        defaultSize={showArtifact ? panelSizes.artifact : 0}
                        minSize={30}
                        className={cn(showArtifact ? "block" : "hidden")}
                    >
                        <div className="h-full overflow-hidden px-4 py-12">
                            {showArtifact && <ArtifactViewer />}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
                {!hasMessages && <AnimatedBackground />}
            </div>
        </FileDropzone>
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
