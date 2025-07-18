"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
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
    // const slowAnimation = firstMessageIdChanged && size >= 5;
    return (
        <div className="flex flex-col gap-8 w-full">
            {renderMessages.map((message, index) => (
                <motion.div
                    key={message.unique_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.5,
                    }}
                >
                    {message.type === "human" ? (
                        <MessageHuman content={message.content} />
                    ) : message.type === "tool" ? (
                        <MessageTool
                            message={message}
                            client={client!}
                            getMessageContent={getMessageContent}
                            formatTokens={formatTokens}
                            isCollapsed={collapsedTools.includes(message.id!)}
                            onToggleCollapse={() =>
                                toggleToolCollapse(message.id!)
                            }
                        />
                    ) : (
                        <MessageAI message={message} />
                    )}
                </motion.div>
            ))}
        </div>
    );
};
