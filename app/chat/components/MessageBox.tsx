"use client";

import React, { useMemo, useRef, useEffect } from "react";
import MessageHuman from "./MessageHuman";
import MessageAI from "./MessageAI";
import MessageTool from "./MessageTool";
import {
    formatTokens,
    getMessageContent,
    LangGraphClient,
    type RenderMessage,
} from "@langgraph-js/sdk";
import { motion } from "motion/react";
import { useChat } from "@langgraph-js/sdk/react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useExtraParams } from "../context/ExtraParamsContext";
import { Message } from "@/src/components/ai-elements/message";

const transTypeToOpenAIType = (type: string) => {
    switch (type) {
        case "human":
            return "user";
        case "tool":
            return "assistant";
        case "ai":
            return "assistant";
    }
    return "assistant";
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
        <>
            {renderMessages.map((message, index) => (
                <Message
                    key={message.id}
                    from={transTypeToOpenAIType(message.type)}
                >
                    {message.type === "human" ? (
                        <MessageHuman message={message}></MessageHuman>
                    ) : message.type === "tool" ? (
                        <MessageTool message={message}></MessageTool>
                    ) : (
                        <MessageAI message={message}></MessageAI>
                    )}
                </Message>
            ))}
        </>
    );
};
