"use client";

import React from "react";
import { type RenderMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { getMessageContent } from "@langgraph-js/sdk";
import { Response } from "@/components/ai-elements/response";
import {
    MessageContent,
    MessageResponse,
} from "@/src/components/ai-elements/message";

interface MessageAIProps {
    message: RenderMessage;
}

const MessageAI: React.FC<MessageAIProps> = ({ message }) => {
    return (
        <MessageContent>
            <div className="flex flex-col p-4 gap-2">
                <div className="text-sm font-medium text-gray-700">
                    {message.name}
                </div>
                <MessageResponse
                    children={getMessageContent(message.content)}
                />
                <UsageMetadata
                    response_metadata={message.response_metadata as any}
                    usage_metadata={message.usage_metadata || {}}
                    spend_time={message.spend_time}
                    id={message.id}
                />
            </div>
        </MessageContent>
    );
};

export default MessageAI;
