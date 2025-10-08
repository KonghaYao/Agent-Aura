"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { MessagesBox } from "./components/MessageBox";
import { ChatProvider, useChat } from "./context/ChatContext";
import {
    ExtraParamsProvider,
    useExtraParams,
} from "./context/ExtraParamsContext";
import { UsageMetadata } from "./components/UsageMetadata";
import { Message } from "@langgraph-js/sdk";
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
import { models } from "@/agent/models";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import AnimatedBackground from "../components/AnimatedBackground";
import FileDropzone from "./components/FileDropzone";
import { defaultUploader } from "./services/uploaders";
import ImageUploader from "./components/ImageUploader";
import { ToolsProvider } from "./context/ToolsContext";
import { MCPConfigDialog } from "./components/MCPConfigDialog";
import HistoryButton from "./components/HistoryButton";

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
        currentAgent,
    } = useChat();
    const { extraParams, setExtraParams } = useExtraParams();
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFileUploaded = (url: string) => {
        setImageUrls((prev) => [...prev, url]);
    };

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
        setCurrentAgent(localStorage.getItem("agent_name") || "");
        return () => {
            window.removeEventListener("fileUploaded", handleFileUploadedEvent);
        };
    }, []);

    // 处理粘贴事件
    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault(); // 阻止默认粘贴行为

                const file = items[i].getAsFile();
                if (file) {
                    const url = await defaultUploader.uploadFile(file);
                    if (url) {
                        handleFileUploaded(url);
                    }
                }
            }
        }
    };

    // const _setCurrentAgent = (agent: string) => {
    //     localStorage.setItem("agent_name", agent);
    //     setCurrentAgent(agent);
    // };

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

    const _setCurrentAgent = (agent: string) => {
        localStorage.setItem("agent_name", agent);
        setCurrentAgent(agent);
    };
    const allowAgents = () => {
        const allow = ["agent", "deep-research", "deep-wiki"];
        return (
            client?.availableAssistants.filter((i) =>
                allow.includes(i.graph_id),
            ) || []
        );
    };
    return (
        <div
            className={cn(
                "w-full border border-gray-200 p-2 rounded-xl bg-white z-10 shadow-xl",
            )}
        >
            {imageUrls.length > 0 && (
                <ImageUploader
                    imageUrls={imageUrls}
                    onAddImage={handleFileUploaded}
                    onRemoveImage={removeImage}
                />
            )}
            <Textarea
                ref={textareaRef}
                className="flex-1 max-h-24 resize-none border-0 shadow-none p-3 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0"
                rows={1}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyPress}
                onPaste={handlePaste}
                autoFocus
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
                {/* <Select
                    value={extraParams.reasoning_model}
                    onValueChange={(value) => {
                        setExtraParams({
                            ...extraParams,
                            reasoning_model: value,
                        });
                    }}
                >
                    <SelectTrigger className="w-fit border-none bg-transparent hover:bg-gray-100 transition-colors rounded-md">
                        <Brain></Brain>
                        <SelectValue placeholder="选择一个模型" />
                    </SelectTrigger>
                    <SelectContent>
                        {models.reasoning_model.map((i) => {
                            return (
                                <SelectItem value={i} key={i}>
                                    {i}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select> */}
                <Select value={currentAgent} onValueChange={_setCurrentAgent}>
                    <SelectTrigger className="w-[180px] border-0 bg-transparent hover:bg-gray-100 transition-colors rounded-md">
                        <SelectValue placeholder="选择一个 Agent" />
                    </SelectTrigger>
                    <SelectContent>
                        {allowAgents().map((i) => {
                            return (
                                <SelectItem value={i.graph_id} key={i.graph_id}>
                                    {i.name}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
                <MCPConfigDialog></MCPConfigDialog>
                {client?.tokenCounter?.output_tokens! > 0 && (
                    <UsageMetadata
                        usage_metadata={client?.tokenCounter || {}}
                    />
                )}
                <div className="flex-1"></div>
                <HistoryButton />
                {imageUrls.length === 0 && (
                    <ImageUploader
                        imageUrls={imageUrls}
                        onAddImage={handleFileUploaded}
                        onRemoveImage={removeImage}
                    />
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
    const { renderMessages } = useChat();
    const { showArtifact } = useArtifacts();
    const [panelSizes, setPanelSizes] = useState({
        chat: 50,
        artifact: 50,
    });

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

                    {showArtifact && (
                        <>
                            <ResizableHandle withHandle />
                            <ResizablePanel
                                defaultSize={panelSizes.artifact}
                                minSize={30}
                            >
                                <div className="h-full overflow-hidden px-4 py-12">
                                    <ArtifactViewer />
                                </div>
                            </ResizablePanel>
                        </>
                    )}
                </ResizablePanelGroup>
                {!hasMessages && <AnimatedBackground />}
            </div>
        </FileDropzone>
    );
};

const ChatWrapper: React.FC = () => {
    return (
        <ChatProvider>
            <ToolsProvider>
                <ExtraParamsProvider>
                    <ArtifactsProvider>
                        <Chat />
                    </ArtifactsProvider>
                </ExtraParamsProvider>
            </ToolsProvider>
        </ChatProvider>
    );
};

export default ChatWrapper;
