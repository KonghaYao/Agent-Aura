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
// import "../markdown.css";
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
import {
    Mention,
    MentionContent,
    MentionInput,
    MentionItem,
} from "@/components/ui/mention";
import {
    Brain,
    Send,
    StopCircle,
    Plus,
    ClosedCaption,
    XIcon,
} from "lucide-react";
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
import { noneAgent } from "../agent-store/mockData";
import {
    Conversation,
    ConversationContent,
    ConversationScrollButton,
} from "@/src/components/ai-elements/conversation";

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

    return (
        <div className="w-full p-4 pt-12 gap-4">
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
        createNewChat,
    } = useChat();
    const { availableAgents, selectAgent } = useAgentConfig();
    const agentConfig = useAgentConfig();
    const { extraParams, setExtraParams } = useExtraParams();
    const [imageUrls, setImageUrls] = useState<string[]>([]);

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
                <Mention
                    inputValue={userInput}
                    onInputValueChange={(e) => {
                        setUserInput(e);
                    }}
                    onValueChange={(data) => {
                        console.log("Mention data:", data);
                        // 如果没有数据，清空选择
                        if (data.length === 0) {
                            selectAgent(noneAgent.id);
                            return;
                        }

                        const lastValue = data.at(-1);
                        // 检查是否是模型选择（以 /model 开头）
                        if (
                            lastValue &&
                            lastValue.startsWith &&
                            lastValue.startsWith("@model ")
                        ) {
                            // 这是模型选择
                            const modelName = lastValue.replace("@model ", "");
                            if (modelName) {
                                setExtraParams({
                                    ...extraParams,
                                    model_name: modelName,
                                });
                            }
                        } else {
                            // 这是 agent 选择
                            const agent = availableAgents.find(
                                (i) => i.name === lastValue,
                            );
                            agent && selectAgent(agent?.id);
                        }
                    }}
                    trigger="@"
                    className="w-full"
                >
                    <MentionInput
                        asChild
                        className="flex-1 max-h-24 resize-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-0 "
                        onPaste={handlePaste}
                        autoFocus
                        placeholder="你好，我是Aura，有什么可以帮你的吗？"
                        disabled={loading}
                    >
                        <textarea />
                    </MentionInput>
                    <MentionContent>
                        {/* 根据输入内容显示不同的选项 */}
                        {(() => {
                            const lastMention = userInput
                                .split("@")
                                .pop()
                                ?.split(" ")[0];
                            if (lastMention === "model") {
                                // 显示模型选项
                                return agentConfig
                                    .getCurrentAgentData()
                                    ?.llm.map((model) => (
                                        <MentionItem
                                            key={model.model}
                                            value={`@model ${model.model}`}
                                            className="flex-col items-start gap-0.5"
                                        >
                                            <span className="text-sm">
                                                {model.model}
                                            </span>
                                        </MentionItem>
                                    ));
                            } else {
                                // 显示 agent 选项
                                return availableAgents.map((user) => (
                                    <MentionItem
                                        key={user.id}
                                        value={user.name}
                                        className="flex-col items-start gap-0.5"
                                    >
                                        <span className="text-sm">
                                            {user.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                            {user.description}
                                        </span>
                                    </MentionItem>
                                ));
                            }
                        })()}
                    </MentionContent>
                </Mention>
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
                        <SelectTrigger className="h-9">
                            <div className="flex items-center gap-2">
                                <Brain className="w-3.5 h-3.5 text-muted-foreground"></Brain>
                                <SelectValue placeholder="选择模型" />
                            </div>
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
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={createNewChat}
                        className="rounded-full hover:bg-gray-100"
                        title="新建对话"
                    >
                        <Plus className="h-5 w-5" />
                    </Button>
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
        <div className="flex flex-col h-full max-w-4xl w-full mx-auto">
            <Conversation>
                <ConversationContent>
                    {hasMessages ? (
                        <ChatMessages />
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 mt-64">
                            <h1 className="text-4xl font-bold mb-6 text-center">
                                <span className="text-4xl pr-2">👋</span>
                                你好，我是 Aura
                            </h1>
                            <p className="text-lg text-gray-500 mb-8 text-center">
                                我是一个 AI 助手，可以帮助你完成各种任务
                            </p>
                        </div>
                    )}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>
            <div className="px-4 w-full pb-8">
                <ChatInput />
            </div>
        </div>
    );
});
ChatContainer.displayName = "ChatContainer";

const Chat: React.FC = () => {
    const { renderMessages } = useChat();
    const { showArtifact, setShowArtifact } = useArtifacts();
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
            <div className="flex h-screen w-full justify-center overflow-hidden">
                {/* <ChatContainer hasMessages={hasMessages} /> */}
                <ResizablePanelGroup
                    direction="horizontal"
                    className="w-full h-full"
                    onLayout={handleResize}
                >
                    <ResizablePanel
                        defaultSize={showArtifact ? panelSizes.chat : 100}
                        className="flex flex-col h-full"
                        minSize={30}
                    >
                        <ChatContainer hasMessages={hasMessages} />
                    </ResizablePanel>

                    {showArtifact && (
                        <>
                            <ResizableHandle
                                withHandle
                                className="bg-gray-200"
                            />
                            <ResizablePanel
                                defaultSize={panelSizes.artifact}
                                minSize={50}
                            >
                                <div className="h-full overflow-hidden border-r border-gray-200 relative flex flex-col">
                                    <div className="flex items-center justify-between border-b border-gray-200 px-2 py-2">
                                        <span className="font-semibold text-sm">
                                            Artifact
                                        </span>
                                        <button
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete Artifact"
                                            onClick={() => {
                                                setShowArtifact(false);
                                            }}
                                        >
                                            <XIcon></XIcon>
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-hidden p-4 max-w-full max-h-full">
                                        <ArtifactViewer />
                                    </div>
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
                withCredentials={true}
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
