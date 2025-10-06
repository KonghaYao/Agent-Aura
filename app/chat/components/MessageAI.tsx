"use client";

import React from "react";
import { RenderMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { getMessageContent } from "@langgraph-js/sdk";
import { MarkdownRenderer } from "../../components/shared/MarkdownRenderer";

interface MessageAIProps {
    message: RenderMessage;
}

const MessageAI: React.FC<MessageAIProps> = ({ message }) => {
    return (
        <div className="flex flex-col w-[80%]">
            <div className="flex flex-col p-4 gap-2">
                <div className="text-sm font-medium text-gray-700">
                    {message.name}
                </div>
                <MarkdownRenderer
                    content={getMessageContent(message.content)}
                />
                <UsageMetadata
                    response_metadata={message.response_metadata as any}
                    usage_metadata={message.usage_metadata || {}}
                    spend_time={message.spend_time}
                    id={message.id}
                />
            </div>
        </div>
    );
};

export default MessageAI;
