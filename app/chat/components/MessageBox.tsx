"use client";

import React, { useMemo, useRef, useEffect } from "react";
import MessageHuman from "./MessageHuman";
import MessageAI from "./MessageAI";
import MessageTool from "./MessageTool";
import {
    formatTokens,
    getMessageContent,
    LangGraphClient,
    RenderMessage,
} from "@langgraph-js/sdk";
import { motion } from "motion/react";
import { useChat } from "../context/ChatContext";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useExtraParams } from "../context/ExtraParamsContext";

// 消息操作栏组件
const MessageActionBar = ({ message }: { message: RenderMessage }) => {
    const { revertChatTo } = useChat();

    const handleRevert = async () => {
        if (message.id) {
            await revertChatTo(message.id);
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleRevert}
            title="回滚到这条消息"
            className="inline-flex"
        >
            <RotateCcw className="w-4 h-4 mr-2" />
        </Button>
    );
};

export const MessagesBox = ({
    renderMessages,
    collapsedTools,
    toggleToolCollapse,
    client,
}: {
    renderMessages: RenderMessage[];
    collapsedTools: string[];
    toggleToolCollapse: (id: string) => void;
    client: LangGraphClient;
}) => {
    const { revertChatTo } = useChat();
    const { extraParams } = useExtraParams();
    const handleRevertToMessage = async (
        message: RenderMessage,
        isRevertAndExecute: boolean = false,
    ) => {
        if (message.id) {
            await revertChatTo(message.id, isRevertAndExecute, {
                extraParams,
            });
        }
    };

    return (
        <div className="flex flex-col gap-8 w-full">
            {renderMessages.map((message, index) => (
                <ContextMenu key={message.unique_id}>
                    <ContextMenuTrigger asChild>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                            }}
                            className="relative group"
                        >
                            {message.type === "human" ? (
                                <MessageHuman
                                    content={message.content}
                                ></MessageHuman>
                            ) : message.type === "tool" ? (
                                <MessageTool
                                    message={message}
                                    getMessageContent={getMessageContent}
                                    isCollapsed={collapsedTools.includes(
                                        message.id!,
                                    )}
                                    onToggleCollapse={() =>
                                        toggleToolCollapse(message.id!)
                                    }
                                ></MessageTool>
                            ) : (
                                <MessageAI message={message}></MessageAI>
                            )}
                        </motion.div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                        <ContextMenuItem
                            onClick={() => handleRevertToMessage(message)}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            撤回到这条消息
                        </ContextMenuItem>
                        <ContextMenuItem
                            onClick={() => handleRevertToMessage(message, true)}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            撤回并重新执行
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            ))}
        </div>
    );
};
