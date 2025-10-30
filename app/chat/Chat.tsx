"use client";

import React, { useState, useRef, useEffect, memo } from "react";
import { MessagesBox } from "./components/MessageBox";
import { ChatProvider, useChat } from "@langgraph-js/sdk/react";
import {
    ExtraParamsProvider,
    useExtraParams,
} from "./context/ExtraParamsContext";
import { UsageMetadata } from "./components/UsageMetadata";
import { type Message } from "@langgraph-js/sdk";
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
import FileDropzone from "./components/FileDropzone";
import { defaultUploader } from "./services/uploaders";
import ImageUploader from "./components/ImageUploader";
import { ToolsProvider } from "./context/ToolsContext";
import HistoryButton from "./components/HistoryButton";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { AgentConfigProvider, useAgentConfig } from "./context";
import { AgentSelectorCompact, AgentInfoPanel } from "./components";

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
                        <Shimmer>正在思考中...</Shimmer>
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
        client,
    } = useChat();
    const agentConfig = useAgentConfig();
    const { extraParams, setExtraParams } = useExtraParams();
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // 当切换 agent 时，检查当前选中的 model 是否有效，如果无效则重置为第一个
    useEffect(() => {
        const currentAgentData = agentConfig.getCurrentAgentData();
        if (currentAgentData && currentAgentData.llm.length > 0) {
            const currentModelName = extraParams.model_name;
            const availableModels = currentAgentData.llm.map((m) => m.model);

            // 如果当前选中的 model 不存在于新 agent 的模型列表中，重置为第一个
            if (
                currentModelName &&
                !availableModels.includes(currentModelName)
            ) {
                setExtraParams({
                    ...extraParams,
                    model_name: currentAgentData.llm[0].model,
                });
            }
            // 如果没有选中任何 model，默认设置为第一个
            else if (!currentModelName) {
                setExtraParams({
                    ...extraParams,
                    model_name: currentAgentData.llm[0].model,
                });
            }
        }
    }, [agentConfig.currentAgent]); // 监听 currentAgent 变化

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
            extraParams: {
                ...extraParams,
                agent_protocol: agentConfig.getCurrentAgentData(),
            },
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
        <div className="space-y-2 w-full">
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
                {/* <AgentInfoPanel /> */}
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
                        value={
                            extraParams.model_name ||
                            agentConfig.getCurrentAgentData()?.llm[0].model ||
                            ""
                        }
                        onValueChange={(value) => {
                            setExtraParams({
                                ...extraParams,
                                model_name: value,
                            });
                        }}
                    >
                        <SelectTrigger className="w-fit border-none bg-transparent hover:bg-gray-100 transition-colors rounded-md">
                            <Brain></Brain>
                            <SelectValue placeholder="选择一个模型" />
                        </SelectTrigger>
                        <SelectContent>
                            {agentConfig
                                .getCurrentAgentData()
                                ?.llm.map((model) => {
                                    return (
                                        <SelectItem
                                            value={model.model}
                                            key={model.model}
                                        >
                                            {model.model}
                                        </SelectItem>
                                    );
                                })}
                        </SelectContent>
                    </Select>

                    {/* Agent 选择器 */}
                    <AgentSelectorCompact />
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
                            !loading &&
                            !userInput.trim() &&
                            imageUrls.length === 0
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
        </div>
    );
};

// 使用memo来记忆ChatContainer组件，避免不必要的重新渲染
const ChatContainer = memo(({ hasMessages }: { hasMessages: boolean }) => {
    return (
        <div className="flex-1 flex flex-col h-full overflow-auto hide-scrollbar">
            <div className="flex-1 flex flex-col items-center justify-center mb-8 w-full max-w-4xl mx-auto">
                {hasMessages ? (
                    <ChatMessages />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <h1 className="text-4xl font-bold mb-6 text-center">
                            <span className="text-4xl pr-2">👋</span>
                            你好，我是 Aura
                        </h1>
                        <p className="text-lg text-gray-500 mb-8 text-center">
                            我是一个 AI 助手，可以帮助你完成各种任务
                        </p>
                    </div>
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
            </div>
        </FileDropzone>
    );
};

const ChatWrapper: React.FC = () => {
    const apiUrl =
        import.meta.env.PUBLIC_AGENT_URL ||
        new URL(
            "/api/langgraph/",
            globalThis.location ? globalThis.location.href : "",
        ).toString();

    return (
        <AgentConfigProvider>
            <ChatProvider
                defaultAgent="agent-graph"
                apiUrl={apiUrl}
                defaultHeaders={{}}
                withCredentials={false}
                showHistory={false}
                showGraph={false}
                onInitError={(error, currentAgent) => {
                    console.error(
                        `Failed to initialize ${currentAgent}:`,
                        error,
                    );
                }}
            >
                <ToolsProvider>
                    <ExtraParamsProvider>
                        <ArtifactsProvider>
                            <Chat />
                        </ArtifactsProvider>
                    </ExtraParamsProvider>
                </ToolsProvider>
            </ChatProvider>
        </AgentConfigProvider>
    );
};

export default ChatWrapper;
